import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: String,
    image: { url: { type: String, required: true }, publicId: String },
    mobileImage: { url: String, publicId: String },
    ctaText: String,
    ctaUrl: { type: String, default: '/products' },
    position: { type: String, enum: ['hero', 'promo', 'offer', 'bulk', 'store'], default: 'hero', index: true },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    startsAt: Date,
    endsAt: Date,
  },
  { timestamps: true }
);
export const Banner = mongoose.model('Banner', schema);
