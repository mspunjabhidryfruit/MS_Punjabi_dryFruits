import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, default: '' },
    content: { type: String, default: '' },
    image: { url: String, publicId: String },
    tag: { type: String, default: 'healthy lifestyle' },
    type: { type: String, enum: ['blog', 'news'], default: 'blog', index: true },
    author: { type: String, default: 'Admin' },
    active: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
export const BlogPost = mongoose.model('BlogPost', schema);
