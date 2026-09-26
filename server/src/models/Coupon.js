import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 }, // 0 = no cap
    startsAt: Date,
    expiresAt: Date,
    active: { type: Boolean, default: true },
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    perUserLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);
export const Coupon = mongoose.model('Coupon', schema);
