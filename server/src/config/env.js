import 'dotenv/config';

const required = ['MONGO_URI', 'JWT_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`);
  process.exit(1);
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  isProd: process.env.NODE_ENV === 'production',
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpires: process.env.JWT_EXPIRES_IN || '7d',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean),
  cloudinary: {
    cloud: process.env.CLOUDINARY_CLOUD_NAME,
    key: process.env.CLOUDINARY_API_KEY,
    secret: process.env.CLOUDINARY_API_SECRET,
  },
  razorpay: { keyId: process.env.RAZORPAY_KEY_ID, keySecret: process.env.RAZORPAY_KEY_SECRET },
  resendKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM || 'MS Punjabi Dry Fruits <onboarding@resend.dev>',
  adminEmail: process.env.ADMIN_EMAIL,
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe@12345',
};
