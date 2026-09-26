import multer from 'multer';
import { ApiError } from '../utils/http.js';
import { cloudinary, cloudinaryReady } from '../config/cloudinary.js';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpe?g|png|webp|avif)$/.test(file.mimetype)) return cb(new ApiError(400, 'Only JPG, PNG, WEBP or AVIF images are allowed'));
    cb(null, true);
  },
});

export function uploadBuffer(buffer, folder = 'ms-punjabi') {
  if (!cloudinaryReady) throw new ApiError(503, 'Image uploads are not configured. Set the CLOUDINARY_* variables on the server.');
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (err, result) => {
      if (err) return reject(new ApiError(502, `Cloudinary: ${err.message}`));
      resolve({ url: result.secure_url, publicId: result.public_id });
    });
    stream.end(buffer);
  });
}

export async function deleteImage(publicId) {
  if (!publicId || !cloudinaryReady) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    console.error('Cloudinary delete failed:', e.message);
  }
}
