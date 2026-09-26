import mongoose from 'mongoose';

export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
export const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed', 'Refunded'];

const itemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: String, required: true },
    slug: String,
    name: { type: String, required: true },
    image: String,
    weight: String,
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 }, // total saving vs MRP for this line
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customer: { name: String, email: String, phone: String },
    shippingAddress: {
      name: String, phone: String, line1: String, line2: String, city: String, state: String, pincode: String,
    },
    items: { type: [itemSchema], validate: [(v) => v.length > 0, 'Order has no items'] },
    coupon: { code: String, type: { type: String }, value: Number, discount: Number },
    subtotal: Number,
    mrpTotal: Number,
    discount: { type: Number, default: 0 }, // coupon discount
    deliveryCharge: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['COD', 'Razorpay'], required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'Pending', index: true },
    payment: { razorpayOrderId: String, razorpayPaymentId: String, razorpaySignature: String, paidAt: Date },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: 'Pending', index: true },
    statusHistory: [{ _id: false, status: String, note: String, at: { type: Date, default: Date.now }, by: String }],
    stockRestored: { type: Boolean, default: false },
    notes: String,
    estimatedDelivery: Date,
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', schema);
