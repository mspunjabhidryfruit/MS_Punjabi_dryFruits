import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Coupon } from '../models/Coupon.js';
import { Order } from '../models/Order.js';
import { getSettings } from './settings.js';
import { ApiError, money } from '../utils/http.js';

const isId = (v) => mongoose.isValidObjectId(v);

export async function evaluateCoupon(code, subtotal, userId) {
  if (!code) return { coupon: null };
  const c = await Coupon.findOne({ code: String(code).trim().toUpperCase() });
  const now = new Date();
  const fail = (msg) => ({ coupon: null, error: msg });
  if (!c || !c.active) return fail('This coupon code is not valid');
  if (c.startsAt && c.startsAt > now) return fail('This coupon is not active yet');
  if (c.expiresAt && c.expiresAt < now) return fail('This coupon has expired');
  if (c.usageLimit && c.usedCount >= c.usageLimit) return fail('This coupon has reached its usage limit');
  if (subtotal < c.minOrder) return fail(`Add items worth Rs. ${money(c.minOrder - subtotal)} more to use this coupon`);
  if (c.perUserLimit && userId) {
    const used = await Order.countDocuments({ user: userId, 'coupon.code': c.code, orderStatus: { $ne: 'Cancelled' } });
    if (used >= c.perUserLimit) return fail('You have already used this coupon');
  }
  let discount = c.type === 'percent' ? (subtotal * c.value) / 100 : c.value;
  if (c.maxDiscount > 0) discount = Math.min(discount, c.maxDiscount);
  discount = money(Math.min(discount, subtotal));
  return { coupon: { code: c.code, type: c.type, value: c.value, description: c.description, discount, id: c._id } };
}

/**
 * Prices a cart entirely from database values.
 * items: [{ productId, variantId, quantity }]
 * strict: throw on unavailable / insufficient stock (used at checkout) instead of clamping.
 */
export async function priceCart(items = [], { couponCode, userId, strict = false } = {}) {
  const settings = await getSettings();
  const clean = items.filter((i) => isId(i.productId) && i.variantId);
  const products = await Product.find({ _id: { $in: clean.map((i) => i.productId) }, visible: true });
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const lines = [];
  const issues = [];

  for (const it of clean) {
    const p = byId.get(String(it.productId));
    const v = p?.variants.id(it.variantId);
    const qty = Math.floor(Number(it.quantity));
    if (!p || !v) {
      if (strict) throw new ApiError(409, 'An item in your cart is no longer available');
      issues.push({ productId: it.productId, variantId: it.variantId, type: 'removed', message: 'An item is no longer available and was removed' });
      continue;
    }
    if (!Number.isFinite(qty) || qty < 1 || qty > 50) throw new ApiError(400, 'Invalid quantity');
    if (v.stock < 1) {
      if (strict) throw new ApiError(409, `${p.name} (${v.weight}) is out of stock`);
      issues.push({ productId: p._id, variantId: v._id, type: 'oos', message: `${p.name} (${v.weight}) is out of stock` });
      continue;
    }
    let q = qty;
    if (qty > v.stock) {
      if (strict) throw new ApiError(409, `Only ${v.stock} of ${p.name} (${v.weight}) left in stock`);
      q = v.stock;
      issues.push({ productId: p._id, variantId: v._id, type: 'reduced', message: `Only ${v.stock} of ${p.name} (${v.weight}) available` });
    }
    const mrp = v.mrp && v.mrp > v.price ? v.mrp : v.price;
    lines.push({
      productId: p._id, variantId: String(v._id), slug: p.slug, name: p.name, image: p.images[0]?.url || '/img/logo.jpg',
      weight: v.weight, packLabel: p.packLabel, quantity: q, stock: v.stock,
      unitPrice: v.price, originalPrice: mrp, discount: money((mrp - v.price) * q), lineTotal: money(v.price * q),
    });
  }

  const subtotal = money(lines.reduce((s, l) => s + l.lineTotal, 0));
  const mrpTotal = money(lines.reduce((s, l) => s + l.originalPrice * l.quantity, 0));
  const { coupon, error: couponError } = await evaluateCoupon(couponCode, subtotal, userId);
  if (strict && couponCode && !coupon) throw new ApiError(400, couponError);
  const discount = coupon?.discount || 0;
  const taxable = money(subtotal - discount);
  const deliveryCharge = lines.length === 0 || taxable >= settings.freeDeliveryThreshold ? 0 : settings.deliveryCharge;
  const tax = money((taxable * (settings.taxPercent || 0)) / 100);
  const total = money(taxable + deliveryCharge + tax);

  return {
    lines, issues, subtotal, mrpTotal, savings: money(mrpTotal - subtotal), discount, coupon, couponError,
    deliveryCharge, tax, total, freeDeliveryThreshold: settings.freeDeliveryThreshold,
    amountToFreeDelivery: Math.max(0, money(settings.freeDeliveryThreshold - taxable)),
  };
}
