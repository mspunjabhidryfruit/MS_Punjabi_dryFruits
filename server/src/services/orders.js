import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Coupon } from '../models/Coupon.js';
import { priceCart } from './pricing.js';
import { emails } from './email.js';
import { ApiError, money } from '../utils/http.js';

export const razorpayReady = Boolean(env.razorpay.keyId && env.razorpay.keySecret);
const rzp = razorpayReady ? new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret }) : null;

const newOrderNumber = () => {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `MSP${ymd}${crypto.randomInt(10000, 99999)}`;
};

export function estimateDelivery(pincode) {
  const zone = Number(String(pincode)[0]);
  const days = [5, 4, 5, 5, 4, 3, 4, 5, 6, 6][zone] ?? 5; // rough zone based estimate (first PIN digit)
  const d = new Date();
  d.setDate(d.getDate() + days);
  return { days, date: d };
}

async function reserveStock(lines) {
  const done = [];
  try {
    for (const l of lines) {
      // eslint-disable-next-line no-await-in-loop
      const r = await Product.updateOne(
        { _id: l.productId, variants: { $elemMatch: { _id: l.variantId, stock: { $gte: l.quantity } } } },
        { $inc: { 'variants.$.stock': -l.quantity, totalStock: -l.quantity, sold: l.quantity } }
      );
      if (r.modifiedCount !== 1) throw new ApiError(409, `${l.name} (${l.weight}) just went out of stock. Please review your cart.`);
      done.push(l);
    }
  } catch (e) {
    await releaseStock(done);
    throw e;
  }
}

async function releaseStock(lines) {
  for (const l of lines) {
    // eslint-disable-next-line no-await-in-loop
    await Product.updateOne(
      { _id: l.productId, 'variants._id': l.variantId },
      { $inc: { 'variants.$.stock': l.quantity, totalStock: l.quantity, sold: -l.quantity } }
    );
  }
}

async function restoreOrderStock(order) {
  if (order.stockRestored) return;
  await releaseStock(order.items);
  order.stockRestored = true;
  if (order.coupon?.code) await Coupon.updateOne({ code: order.coupon.code, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
}

export async function createOrder(user, body) {
  const priced = await priceCart(body.items, { couponCode: body.couponCode, userId: user._id, strict: true });
  if (!priced.lines.length) throw new ApiError(400, 'Your cart is empty');
  if (body.paymentMethod === 'Razorpay' && !razorpayReady) throw new ApiError(503, 'Online payments are not available right now. Please choose Cash on Delivery.');

  if (priced.coupon) {
    const c = priced.coupon;
    const q = { _id: c.id };
    const r = await Coupon.updateOne(
      { ...q, $or: [{ usageLimit: 0 }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] },
      { $inc: { usedCount: 1 } }
    );
    if (r.modifiedCount !== 1) throw new ApiError(400, 'This coupon has reached its usage limit');
  }
  try {
    await reserveStock(priced.lines);
  } catch (e) {
    if (priced.coupon) await Coupon.updateOne({ _id: priced.coupon.id }, { $inc: { usedCount: -1 } });
    throw e;
  }

  const eta = estimateDelivery(body.shippingAddress.pincode);
  let order;
  try {
    order = await Order.create({
      orderNumber: newOrderNumber(),
      user: user._id,
      customer: { name: user.name, email: user.email, phone: body.shippingAddress.phone },
      shippingAddress: body.shippingAddress,
      items: priced.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, slug: l.slug, name: l.name, image: l.image, weight: l.weight, quantity: l.quantity, unitPrice: l.unitPrice, originalPrice: l.originalPrice, discount: l.discount, lineTotal: l.lineTotal })),
      coupon: priced.coupon ? { code: priced.coupon.code, type: priced.coupon.type, value: priced.coupon.value, discount: priced.coupon.discount } : undefined,
      subtotal: priced.subtotal, mrpTotal: priced.mrpTotal, discount: priced.discount, deliveryCharge: priced.deliveryCharge, tax: priced.tax,
      grandTotal: priced.total, paymentMethod: body.paymentMethod, notes: body.notes, estimatedDelivery: eta.date,
      statusHistory: [{ status: 'Pending', note: 'Order placed', by: 'customer' }],
    });
  } catch (e) {
    await releaseStock(priced.lines);
    if (priced.coupon) await Coupon.updateOne({ _id: priced.coupon.id }, { $inc: { usedCount: -1 } });
    throw e;
  }

  let razorpay = null;
  if (body.paymentMethod === 'Razorpay') {
    try {
      const rOrder = await rzp.orders.create({ amount: Math.round(order.grandTotal * 100), currency: 'INR', receipt: order.orderNumber });
      order.payment = { razorpayOrderId: rOrder.id };
      await order.save();
      razorpay = { keyId: env.razorpay.keyId, orderId: rOrder.id, amount: rOrder.amount, currency: rOrder.currency };
    } catch (e) {
      await cancelOrder(order, 'Payment could not be started', 'system');
      throw e;
    }
  } else {
    emails.orderConfirmation(order);
    emails.adminNewOrder(order);
  }
  user.cart = [];
  await user.save();
  return { order, razorpay };
}

export async function verifyPayment(user, { razorpay_order_id: rid, razorpay_payment_id: pid, razorpay_signature: sig }) {
  const order = await Order.findOne({ 'payment.razorpayOrderId': rid, user: user._id });
  if (!order) throw new ApiError(404, 'Order not found for this payment');
  if (order.paymentStatus === 'Paid') return order;
  const expected = crypto.createHmac('sha256', env.razorpay.keySecret).update(`${rid}|${pid}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(sig));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    order.paymentStatus = 'Failed';
    await order.save();
    throw new ApiError(400, 'Payment verification failed. If money was deducted it will be refunded automatically.');
  }
  order.paymentStatus = 'Paid';
  order.payment = { razorpayOrderId: rid, razorpayPaymentId: pid, razorpaySignature: sig, paidAt: new Date() };
  order.orderStatus = 'Confirmed';
  order.statusHistory.push({ status: 'Confirmed', note: 'Payment received', by: 'system' });
  await order.save();
  emails.orderConfirmation(order);
  emails.paymentConfirmation(order);
  emails.adminNewOrder(order);
  emails.adminPayment(order);
  return order;
}

export async function cancelOrder(order, note, by) {
  if (order.orderStatus === 'Cancelled') return order;
  await restoreOrderStock(order);
  order.orderStatus = 'Cancelled';
  if (order.paymentStatus === 'Pending') order.paymentStatus = 'Failed';
  order.statusHistory.push({ status: 'Cancelled', note, by });
  await order.save();
  return order;
}

const TRANSITIONS = {
  Pending: ['Confirmed', 'Processing', 'Cancelled'],
  Confirmed: ['Processing', 'Shipped', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled'],
  Shipped: ['Out for Delivery', 'Delivered', 'Cancelled'],
  'Out for Delivery': ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: [],
};

export async function setStatus(order, status, note = '', by = 'admin') {
  if (status === order.orderStatus) return order;
  if (!TRANSITIONS[order.orderStatus]?.includes(status)) throw new ApiError(400, `Cannot move an order from ${order.orderStatus} to ${status}`);
  if (status === 'Cancelled') {
    await cancelOrder(order, note || 'Cancelled by admin', by);
  } else {
    order.orderStatus = status;
    if (status === 'Delivered' && order.paymentMethod === 'COD') order.paymentStatus = 'Paid';
    order.statusHistory.push({ status, note, by });
    await order.save();
  }
  emails.orderStatus(order);
  emails.adminStatus(order);
  return order;
}

export const publicOrder = (o) => {
  const obj = o.toObject ? o.toObject() : o;
  if (obj.payment) delete obj.payment.razorpaySignature;
  delete obj.__v;
  return obj;
};
export { money };
