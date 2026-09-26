import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  { email: { type: String, required: true, unique: true, lowercase: true, trim: true }, active: { type: Boolean, default: true } },
  { timestamps: true }
);
export const NewsletterSubscriber = mongoose.model('NewsletterSubscriber', schema);
