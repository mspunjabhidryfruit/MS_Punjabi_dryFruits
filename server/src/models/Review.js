import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: String,
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true, maxlength: 1200 },
    verified: { type: Boolean, default: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  },
  { timestamps: true }
);
schema.index({ product: 1, user: 1 }, { unique: true });
export const Review = mongoose.model('Review', schema);
