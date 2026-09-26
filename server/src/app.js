import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { sanitize } from './middleware/security.js';
import { notFound, errorHandler } from './middleware/error.js';
import routes from './routes/index.js';

const app = express();
app.set('trust proxy', 1); // Render sits behind a proxy
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, cb) => (!origin || env.clientUrls.includes(origin) ? cb(null, true) : cb(new Error('Origin not allowed by CORS'))),
  credentials: true,
}));
app.use(compression());
if (!env.isProd) app.use(morgan('dev'));
app.use(express.json({ limit: '200kb' }));
app.use(sanitize);
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many requests. Please slow down.' } }));
app.use('/api', routes);
app.get('/', (_req, res) => res.json({ success: true, data: { name: 'MS Punjabi Dry Fruits API' } }));
app.use(notFound);
app.use(errorHandler);
export default app;
