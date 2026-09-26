import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    message: { type: String, required: true, maxlength: 3000 },
    status: { type: String, enum: ['new', 'read', 'resolved'], default: 'new', index: true },
  },
  { timestamps: true }
);
export const ContactMessage = mongoose.model('ContactMessage', schema);
