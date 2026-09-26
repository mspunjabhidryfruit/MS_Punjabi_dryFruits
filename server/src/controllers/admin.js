import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Collection } from '../models/Collection.js';
import { Banner } from '../models/Banner.js';
import { BlogPost } from '../models/BlogPost.js';
import { Coupon } from '../models/Coupon.js';
import { Order, ORDER_STATUSES, PAYMENT_STATUSES } from '../models/Order.js';
import { User } from '../models/User.js';
import { Review } from '../models/Review.js';
import { ContactMessage } from '../models/ContactMessage.js';
import { NewsletterSubscriber } from '../models/NewsletterSubscriber.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { getSettings } from '../services/settings.js';
import { setStatus, publicOrder } from '../services/orders.js';
import { buildInvoice, buildShippingLabel } from '../services/pdf.js';
import { emails } from '../services/email.js';
import { uploadBuffer, deleteImage } from '../middleware/upload.js';
import { ApiError, ah, ok, uniqueSlug, escapeRegex, pageParams, money } from '../utils/http.js';

const paged = (page, limit, total) => ({ pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
const needId = (id) => { if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid id'); };

// ---------- uploads ----------
export const uploadImages = ah(async (req, res) => {
  if (!req.files?.length) throw new ApiError(400, 'Choose at least one image');
  const folder = /^[a-z-]{2,20}$/.test(req.query.folder || '') ? `ms-punjabi/${req.query.folder}` : 'ms-punjabi';
  const images = [];
  for (const f of req.files) images.push(await uploadBuffer(f.buffer, folder)); // eslint-disable-line no-await-in-loop
  ok(res, { images }, 201);
});
export const removeImage = ah(async (req, res) => {
  await deleteImage(req.body.publicId);
  ok(res, {});
});

// ---------- generic CRUD factory (categories, collections, banners, coupons, blog) ----------
export function crud(Model, { slugFrom, imageFields = ['image'], sort = '-createdAt', searchFields = ['name'], schema, transform } = {}) {
  const imgs = (doc) => imageFields.map((f) => doc?.[f]?.publicId).filter(Boolean);
  return {
    list: ah(async (req, res) => {
      const { page, limit, skip } = pageParams(req.query, 20, 100);
      const filter = {};
      if (req.query.q) { const rx = new RegExp(escapeRegex(req.query.q), 'i'); filter.$or = searchFields.map((f) => ({ [f]: rx })); }
      const [items, total] = await Promise.all([Model.find(filter).sort(sort).skip(skip).limit(limit).lean(), Model.countDocuments(filter)]);
      ok(res, { items }, 200, paged(page, limit, total));
    }),
    get: ah(async (req, res) => { needId(req.params.id); const item = await Model.findById(req.params.id).lean(); if (!item) throw new ApiError(404, 'Not found'); ok(res, { item }); }),
    create: ah(async (req, res) => {
      const data = schema ? schema.parse(req.body) : req.body;
      if (slugFrom) data.slug = await uniqueSlug(Model, data[slugFrom]);
      ok(res, { item: await Model.create(transform ? transform(data) : data) }, 201);
    }),
    update: ah(async (req, res) => {
      needId(req.params.id);
      const item = await Model.findById(req.params.id);
      if (!item) throw new ApiError(404, 'Not found');
      const data = schema ? schema.parse(req.body) : req.body;
      delete data._id; delete data.slug; delete data.createdAt; delete data.updatedAt; delete data.usedCount;
      const before = imgs(item);
      item.set(transform ? transform(data) : data);
      await item.save();
      const after = imgs(item);
      await Promise.all(before.filter((p) => !after.includes(p)).map(deleteImage));
      ok(res, { item });
    }),
    remove: ah(async (req, res) => {
      needId(req.params.id);
      const item = await Model.findById(req.params.id);
      if (!item) throw new ApiError(404, 'Not found');
      if (Model === Category && (await Product.exists({ category: item._id }))) throw new ApiError(409, 'This category still has products. Move or delete them first.');
      await item.deleteOne();
      await Promise.all(imgs(item).map(deleteImage));
      ok(res, {});
    }),
  };
}

// ---------- products ----------
export const adminProducts = {
  list: ah(async (req, res) => {
    const { page, limit, skip } = pageParams(req.query, 20, 100);
    const filter = {};
    if (req.query.q) filter.name = new RegExp(escapeRegex(req.query.q), 'i');
    if (req.query.category) filter.category = req.query.category;
    if (req.query.stock === 'low') filter.totalStock = { $lte: 10 };
    const [items, total] = await Promise.all([Product.find(filter).populate('category', 'name').sort('-createdAt').skip(skip).limit(limit).lean(), Product.countDocuments(filter)]);
    ok(res, { items }, 200, paged(page, limit, total));
  }),
  get: ah(async (req, res) => { needId(req.params.id); const item = await Product.findById(req.params.id).lean(); if (!item) throw new ApiError(404, 'Product not found'); ok(res, { item }); }),
  create: ah(async (req, res) => {
    const data = req.body;
    if (!(await Category.exists({ _id: data.category }))) throw new ApiError(400, 'Choose a valid category');
    const p = await Product.create({ ...data, slug: await uniqueSlug(Product, data.name) });
    ok(res, { item: p }, 201);
  }),
  update: ah(async (req, res) => {
    needId(req.params.id);
    const p = await Product.findById(req.params.id);
    if (!p) throw new ApiError(404, 'Product not found');
    const oldIds = p.images.map((i) => i.publicId).filter(Boolean);
    p.set(req.body);
    await p.save();
    const keep = p.images.map((i) => i.publicId);
    await Promise.all(oldIds.filter((id) => !keep.includes(id)).map(deleteImage));
    ok(res, { item: p });
  }),
  remove: ah(async (req, res) => {
    needId(req.params.id);
    const p = await Product.findById(req.params.id);
    if (!p) throw new ApiError(404, 'Product not found');
    await p.deleteOne();
    await Promise.all(p.images.map((i) => deleteImage(i.publicId)));
    await User.updateMany({}, { $pull: { wishlist: p._id, cart: { productId: p._id } } });
    ok(res, {});
  }),
};

// ---------- orders ----------
export const adminOrders = {
  list: ah(async (req, res) => {
    const { page, limit, skip } = pageParams(req.query, 20, 100);
    const f = {};
    if (ORDER_STATUSES.includes(req.query.status)) f.orderStatus = req.query.status;
    if (PAYMENT_STATUSES.includes(req.query.payment)) f.paymentStatus = req.query.payment;
    if (['COD', 'Razorpay'].includes(req.query.method)) f.paymentMethod = req.query.method;
    if (req.query.from || req.query.to) f.createdAt = { ...(req.query.from && { $gte: new Date(req.query.from) }), ...(req.query.to && { $lte: new Date(`${req.query.to}T23:59:59.999Z`) }) };
    if (req.query.q) { const rx = new RegExp(escapeRegex(req.query.q), 'i'); f.$or = [{ orderNumber: rx }, { 'customer.name': rx }, { 'customer.email': rx }, { 'customer.phone': rx }]; }
    const [items, total] = await Promise.all([Order.find(f).sort('-createdAt').skip(skip).limit(limit).lean(), Order.countDocuments(f)]);
    ok(res, { items }, 200, paged(page, limit, total));
  }),
  get: ah(async (req, res) => {
    needId(req.params.id);
    const o = await Order.findById(req.params.id).populate('user', 'name email phone createdAt');
    if (!o) throw new ApiError(404, 'Order not found');
    ok(res, { order: publicOrder(o) });
  }),
  status: ah(async (req, res) => {
    needId(req.params.id);
    const o = await Order.findById(req.params.id);
    if (!o) throw new ApiError(404, 'Order not found');
    await setStatus(o, req.body.status, req.body.note, req.user.email);
    ok(res, { order: publicOrder(o) });
  }),
  paymentStatus: ah(async (req, res) => {
    needId(req.params.id);
    if (!PAYMENT_STATUSES.includes(req.body.paymentStatus)) throw new ApiError(400, 'Invalid payment status');
    const o = await Order.findById(req.params.id);
    if (!o) throw new ApiError(404, 'Order not found');
    o.paymentStatus = req.body.paymentStatus;
    o.statusHistory.push({ status: o.orderStatus, note: `Payment marked ${req.body.paymentStatus}`, by: req.user.email });
    await o.save();
    ok(res, { order: publicOrder(o) });
  }),
  notify: ah(async (req, res) => {
    needId(req.params.id);
    const o = await Order.findById(req.params.id);
    if (!o) throw new ApiError(404, 'Order not found');
    const sent = o.orderStatus === 'Pending' ? await emails.orderConfirmation(o) : await emails.orderStatus(o);
    if (!sent) throw new ApiError(502, 'Email could not be sent. Check RESEND_API_KEY and EMAIL_FROM on the server.');
    ok(res, { message: 'Notification sent' });
  }),
  invoice: ah(async (req, res) => {
    needId(req.params.id);
    const o = await Order.findById(req.params.id);
    if (!o) throw new ApiError(404, 'Order not found');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="MS-Punjabi-Dry-Fruits-${o.orderNumber}.pdf"`);
    await buildInvoice(o, res);
  }),
  shipping: ah(async (req, res) => {
    needId(req.params.id);
    const o = await Order.findById(req.params.id);
    if (!o) throw new ApiError(404, 'Order not found');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Shipping-${o.orderNumber}.pdf"`);
    await buildShippingLabel(o, res);
  }),
};

// ---------- dashboard ----------
export const dashboard = ah(async (req, res) => {
  const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[req.query.range] || 30;
  const to = req.query.to ? new Date(`${req.query.to}T23:59:59.999Z`) : new Date();
  const from = req.query.from ? new Date(`${req.query.from}T00:00:00.000Z`) : new Date(to.getTime() - days * 86400000);
  if (Number.isNaN(+from) || Number.isNaN(+to) || from > to || to - from > 800 * 86400000) throw new ApiError(400, 'Invalid date range (max about 2 years)');
  const range = { createdAt: { $gte: from, $lte: to } };
  const live = { ...range, orderStatus: { $ne: 'Cancelled' } };

  const STATUS_LIST = ['Pending', 'Processing', 'Delivered', 'Cancelled'];
  const [liveOrders, statusCounts, lowStock, recent, customers, products] = await Promise.all([
    Order.find(live).select('grandTotal createdAt items.productId items.name items.image items.quantity items.lineTotal').limit(50000).lean(),
    Promise.all(STATUS_LIST.map((st) => Order.countDocuments({ ...range, orderStatus: st }))),
    Product.find({ totalStock: { $lte: 10 } }).select('name totalStock images').sort('totalStock').limit(8).lean(),
    Order.find().sort('-createdAt').limit(8).select('orderNumber customer grandTotal orderStatus paymentStatus paymentMethod createdAt').lean(),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments(),
  ]);

  // totals, daily series and top products are computed in code so this works on any MongoDB-compatible engine
  const day = new Map();
  const topMap = new Map();
  let revenue = 0;
  for (const o of liveOrders) {
    revenue += o.grandTotal;
    const k = o.createdAt.toISOString().slice(0, 10);
    const d = day.get(k) || { revenue: 0, orders: 0 };
    d.revenue += o.grandTotal; d.orders += 1; day.set(k, d);
    for (const it of o.items) {
      const key = String(it.productId);
      const t = topMap.get(key) || { _id: it.productId, name: it.name, image: it.image, qty: 0, revenue: 0 };
      t.qty += it.quantity; t.revenue += it.lineTotal; topMap.set(key, t);
    }
  }
  const top = [...topMap.values()].sort((x, y) => y.qty - x.qty).slice(0, 5).map((t) => ({ ...t, revenue: money(t.revenue) }));
  const filled = [];
  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const k = d.toISOString().slice(0, 10);
    filled.push({ date: k, revenue: money(day.get(k)?.revenue || 0), orders: day.get(k)?.orders || 0 });
  }
  const [pending, processing, delivered, cancelled] = statusCounts;
  ok(res, {
    range: { from, to },
    revenue: money(revenue), orders: liveOrders.length, customers, products,
    status: { pending, processing, delivered, cancelled },
    series: filled, topProducts: top, lowStock, recentOrders: recent,
  });
});

// ---------- customers ----------
export const customers = {
  list: ah(async (req, res) => {
    const { page, limit, skip } = pageParams(req.query, 20, 100);
    const f = { role: 'customer' };
    if (req.query.q) { const rx = new RegExp(escapeRegex(req.query.q), 'i'); f.$or = [{ name: rx }, { email: rx }, { phone: rx }]; }
    const [items, total] = await Promise.all([User.find(f).sort('-createdAt').skip(skip).limit(limit).lean(), User.countDocuments(f)]);
    items.forEach((u) => { delete u.password; });
    ok(res, { items }, 200, paged(page, limit, total));
  }),
  get: ah(async (req, res) => {
    needId(req.params.id);
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, 'Customer not found');
    const orders = await Order.find({ user: user._id }).sort('-createdAt').select('orderNumber grandTotal orderStatus paymentStatus createdAt').lean();
    ok(res, { user, orders, totalSpent: money(orders.filter((o) => o.orderStatus !== 'Cancelled').reduce((s, o) => s + o.grandTotal, 0)) });
  }),
  toggle: ah(async (req, res) => {
    needId(req.params.id);
    const user = await User.findOne({ _id: req.params.id, role: 'customer' });
    if (!user) throw new ApiError(404, 'Customer not found');
    user.active = !user.active;
    await user.save();
    ok(res, { user });
  }),
};

// ---------- reviews ----------
async function recalcRating(productId) {
  const rows = await Review.find({ product: productId, status: 'approved' }).select('rating').lean();
  const n = rows.length;
  const avg = n ? Math.round((rows.reduce((t, r) => t + r.rating, 0) / n) * 10) / 10 : 0;
  await Product.updateOne({ _id: productId }, { ratingAvg: avg, ratingCount: n });
}
export const reviews = {
  list: ah(async (req, res) => {
    const { page, limit, skip } = pageParams(req.query, 20, 100);
    const f = ['pending', 'approved', 'rejected'].includes(req.query.status) ? { status: req.query.status } : {};
    const [items, total] = await Promise.all([Review.find(f).populate('product', 'name slug').sort('-createdAt').skip(skip).limit(limit).lean(), Review.countDocuments(f)]);
    ok(res, { items }, 200, paged(page, limit, total));
  }),
  setStatus: ah(async (req, res) => {
    needId(req.params.id);
    if (!['approved', 'rejected', 'pending'].includes(req.body.status)) throw new ApiError(400, 'Invalid status');
    const r = await Review.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!r) throw new ApiError(404, 'Review not found');
    await recalcRating(r.product);
    ok(res, { item: r });
  }),
  remove: ah(async (req, res) => {
    needId(req.params.id);
    const r = await Review.findByIdAndDelete(req.params.id);
    if (r) await recalcRating(r.product);
    ok(res, {});
  }),
};

// ---------- messages / newsletter ----------
export const messages = {
  list: ah(async (req, res) => {
    const { page, limit, skip } = pageParams(req.query, 20, 100);
    const f = ['new', 'read', 'resolved'].includes(req.query.status) ? { status: req.query.status } : {};
    const [items, total] = await Promise.all([ContactMessage.find(f).sort('-createdAt').skip(skip).limit(limit).lean(), ContactMessage.countDocuments(f)]);
    ok(res, { items }, 200, paged(page, limit, total));
  }),
  setStatus: ah(async (req, res) => {
    needId(req.params.id);
    if (!['new', 'read', 'resolved'].includes(req.body.status)) throw new ApiError(400, 'Invalid status');
    const m = await ContactMessage.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!m) throw new ApiError(404, 'Message not found');
    ok(res, { item: m });
  }),
  remove: ah(async (req, res) => { needId(req.params.id); await ContactMessage.findByIdAndDelete(req.params.id); ok(res, {}); }),
};
export const newsletter = {
  list: ah(async (req, res) => {
    const { page, limit, skip } = pageParams(req.query, 30, 200);
    const f = req.query.q ? { email: new RegExp(escapeRegex(req.query.q), 'i') } : {};
    const [items, total] = await Promise.all([NewsletterSubscriber.find(f).sort('-createdAt').skip(skip).limit(limit).lean(), NewsletterSubscriber.countDocuments(f)]);
    ok(res, { items }, 200, paged(page, limit, total));
  }),
  csv: ah(async (_req, res) => {
    const rows = await NewsletterSubscriber.find().sort('-createdAt').lean();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="newsletter-subscribers.csv"');
    res.send(['email,status,subscribed_at', ...rows.map((r) => `${r.email},${r.active ? 'active' : 'disabled'},${r.createdAt.toISOString()}`)].join('\n'));
  }),
  toggle: ah(async (req, res) => {
    needId(req.params.id);
    const s = await NewsletterSubscriber.findById(req.params.id);
    if (!s) throw new ApiError(404, 'Subscriber not found');
    s.active = !s.active; await s.save();
    ok(res, { item: s });
  }),
  remove: ah(async (req, res) => { needId(req.params.id); await NewsletterSubscriber.findByIdAndDelete(req.params.id); ok(res, {}); }),
};

// ---------- settings ----------
export const settings = {
  get: ah(async (_req, res) => ok(res, { settings: await getSettings() })),
  update: ah(async (req, res) => {
    const s = await getSettings();
    const b = { ...req.body };
    ['_id', 'key', 'createdAt', 'updatedAt', '__v'].forEach((k) => delete b[k]);
    for (const k of ['freeDeliveryThreshold', 'deliveryCharge', 'taxPercent']) {
      if (b[k] !== undefined && (!Number.isFinite(Number(b[k])) || Number(b[k]) < 0)) throw new ApiError(400, `${k} must be a positive number`);
    }
    if (b.taxPercent > 40) throw new ApiError(400, 'Tax percent looks too high');
    s.set(b);
    await s.save();
    ok(res, { settings: s });
  }),
};
export { SiteSettings, Collection, Banner, BlogPost, Coupon, Category };
