import { ZodError } from 'zod';
import { ApiError } from '../utils/http.js';
import { env } from '../config/env.js';

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let details = err.details;

  if (err instanceof ZodError) {
    status = 400;
    message = err.issues[0]?.message ? `${err.issues[0].path.join('.') || 'input'}: ${err.issues[0].message}` : 'Invalid input';
    details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
  } else if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    message = Object.values(err.errors)[0]?.message || 'Validation failed';
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    message = `${field} already exists`;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Session expired. Please sign in again.';
  } else if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Image is larger than 5 MB' : err.message;
  } else if (err.error?.description) {
    status = err.statusCode && err.statusCode < 500 ? 400 : 502;
    message = `Payment provider: ${err.error.description}`;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  }

  if (status >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
    if (env.isProd) message = 'Something went wrong on our side. Please try again.';
  }
  res.status(status).json({ success: false, message, ...(details ? { details } : {}) });
}
