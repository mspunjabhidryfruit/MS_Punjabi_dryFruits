import mongoose from 'mongoose';

const offer = new mongoose.Schema({ _id: false, title: String, subtitle: String, note: String, image: String, url: String });

const schema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    storeName: { type: String, default: 'MS Punjabi Dry Fruits' },
    logo: { type: String, default: '/img/logo.jpg' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    freeDeliveryThreshold: { type: Number, default: 300 },
    deliveryCharge: { type: Number, default: 49 },
    taxPercent: { type: Number, default: 0 }, // 0 = prices already include tax
    social: { facebook: String, instagram: String, whatsapp: String },
    newsletter: { heading: { type: String, default: 'Subscribe to our Email alerts' }, enabled: { type: Boolean, default: true } },
    announcements: { type: [String], default: [] },
    navLinks: { type: [{ _id: false, label: String, to: String }], default: [] },
    faqs: { type: [{ _id: false, q: String, a: String }], default: [] },
    testimonials: { type: [{ _id: false, name: String, text: String, rating: { type: Number, default: 5 } }], default: [] },
    stats: { type: [{ _id: false, value: String, label: String }], default: [] },
    purposes: { type: [{ _id: false, label: String, to: String }], default: [] },
    popup: {
      enabled: { type: Boolean, default: true },
      title: { type: String, default: 'Limited Time Offers' },
      subtitle: { type: String, default: "Grab these exclusive deals before they're gone" },
      offers: { type: [offer], default: [] },
      ctaText: { type: String, default: 'Shop Now' },
      ctaUrl: { type: String, default: '/products' },
      priority: { type: Number, default: 1 },
      delaySeconds: { type: Number, default: 4 },
    },
  },
  { timestamps: true }
);
export const SiteSettings = mongoose.model('SiteSettings', schema);
