import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    image: { url: String, publicId: String },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    seoTitle: String,
    heroTitle: String,
  },
  { timestamps: true }
);
export const Category = mongoose.model('Category', schema);
