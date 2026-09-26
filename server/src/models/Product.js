import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  weight: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  mrp: { type: Number, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  sku: { type: String, trim: true },
});

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, index: true },
    shortDescription: { type: String, default: '', maxlength: 240 },
    description: { type: String, default: '' },
    benefits: [String],
    highlights: [String],
    images: [{ _id: false, url: { type: String, required: true }, publicId: String }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    collections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],
    tags: [String],
    variants: { type: [variantSchema], validate: [(v) => v.length > 0, 'At least one weight option is required'] },
    packLabel: { type: String, default: 'Pack of 1' },
    badge: { type: String, default: '' }, // e.g. "Pack of 2", "New Launch"; discount badge is computed
    brand: { type: String, default: 'MS Punjabi Dry Fruits' },
    visible: { type: Boolean, default: true, index: true },
    isBestSeller: { type: Boolean, default: false, index: true },
    isCombo: { type: Boolean, default: false, index: true },
    isExotic: { type: Boolean, default: false, index: true },
    featured: { type: Boolean, default: false },
    sold: { type: Number, default: 0 },
    // denormalised from variants for fast filter/sort
    price: { type: Number, index: true },
    mrp: { type: Number },
    discountPercent: { type: Number, default: 0 },
    totalStock: { type: Number, default: 0 },
    weightLabels: [String],
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    seoTitle: String,
    seoDescription: String,
  },
  { timestamps: true }
);

schema.index({ name: 'text', tags: 'text', shortDescription: 'text' });

schema.pre('save', function denormalise(next) {
  const first = this.variants.reduce((a, b) => (a && a.price <= b.price ? a : b), null);
  if (first) {
    this.price = first.price;
    this.mrp = first.mrp && first.mrp > first.price ? first.mrp : first.price;
    this.discountPercent = this.mrp > this.price ? Math.round(((this.mrp - this.price) / this.mrp) * 100) : 0;
  }
  this.totalStock = this.variants.reduce((s, v) => s + (v.stock || 0), 0);
  this.weightLabels = [...new Set(this.variants.map((v) => v.weight))];
  next();
});

export const Product = mongoose.model('Product', schema);
