import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

export const cloudinaryReady = Boolean(env.cloudinary.cloud && env.cloudinary.key && env.cloudinary.secret);
if (cloudinaryReady) {
  cloudinary.config({ cloud_name: env.cloudinary.cloud, api_key: env.cloudinary.key, api_secret: env.cloudinary.secret, secure: true });
}
export { cloudinary };
