import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Collection } from '../models/Collection.js';
import { Banner } from '../models/Banner.js';
import { BlogPost } from '../models/BlogPost.js';
import { Review } from '../models/Review.js';
import { Order } from '../models/Order.js';
import { Coupon } from '../models/Coupon.js';
import { User } from '../models/User.js';
import { ContactMessage } from '../models/ContactMessage.js';
import { NewsletterSubscriber } from '../models/NewsletterSubscriber.js';
import { getPublicSettings } from '../services/settings.js';
import { priceCart, evaluateCoupon } from '../services/pricing.js';
import { estimateDelivery } from '../services/orders.js';
import { emails } from '../services/email.js';
import { ApiError, ah, ok, escapeRegex, pageParams } from '../utils/http.js';

const CARD_FIELDS = 'name slug images price mrp discountPercent badge packLabel ratingAvg ratingCount weightLabels totalStock variants category isCombo';

export const listProducts = ah(async (req, res) => {
  const q = req.query;
  const filter = { visible: true };
  if (q.q) {
    const rx = new RegExp(escapeRegex(String(q.q).slice(0, 60)), 'i');
    filter.$or = [{ name: rx }, { tags: rx }, { shortDescription: rx }];
  }
  if (q.category) {
    const cats = await Category.find({ slug: { $in: String(q.category).split(',') }, active: true }).select('_id');
    filter.category = { $in: cats.map((c) => c._id) };
  }
  if (q.collection) {
    const cols = await Collection.find({ slug: String(q.collection), active: true }).select('_id');
    filter.collections = { $in: cols.map((c) => c._id) };
  }
  if (q.minPrice || q.maxPrice) {
    filter.price = {};
    if (Number(q.minPrice) >= 0 && q.minPrice !== undefined && q.minPrice !== '') filter.price.$gte = Number(q.minPrice);
    if (Number(q.maxPrice) > 0) filter.price.$lte = Number(q.maxPrice);
  }
  if (q.weight) filter.weightLabels = { $in: String(q.weight).split(',') };
  if (q.availability === 'in') filter.totalStock = { $gt: 0 };
  if (q.availability === 'out') filter.totalStock = { $lte: 0 };
  ['bestSeller:isBestSeller', 'combo:isCombo', 'exotic:isExotic', 'featured:featured'].forEach((p) => {
    const [k, f] = p.split(':');
    if (q[k] === 'true') filter[f] = true;
  });
  const sorts = {
    featured: { featured: -1, isBestSeller: -1, createdAt: -1 },
    'price-asc': { price: 1 }, 'price-desc': { price: -1 }, newest: { createdAt: -1 }, best: { sold: -1, ratingAvg: -1 },
  };
  const { page, limit, skip } = pageParams(q, 12);
  const [items, total] = await Promise.all([
    Product.find(filter).select(CARD_FIELDS).populate('category', 'name slug').sort(sorts[q.sort] || sorts.featured).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  const weights = await Product.distinct('weightLabels', { visible: true });
  ok(res, { items, weights }, 200, { pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getProduct = ah(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, visible: true }).populate('category', 'name slug').lean();
  if (!product) throw new ApiError(404, 'Product not found');
  const [reviews, related] = await Promise.all([
    Review.find({ product: product._id, status: 'approved' }).sort('-createdAt').limit(30).select('name rating comment verified createdAt').lean(),
    Product.find({ visible: true, _id: { $ne: product._id }, category: product.category._id }).select(CARD_FIELDS).populate('category', 'name slug').limit(8).lean(),
  ]);
  ok(res, { product, reviews, related });
});

const now = () => new Date();
const activeWindow = () => ({ active: true, $and: [{ $or: [{ startsAt: null }, { startsAt: { $exists: false } }, { startsAt: { $lte: now() } }] }, { $or: [{ endsAt: null }, { endsAt: { $exists: false } }, { endsAt: { $gte: now() } }] }] });

export const home = ah(async (_req, res) => {
  const [settings, banners, categories, bestSellers, combos, exotic, blogs] = await Promise.all([
    getPublicSettings(),
    Banner.find(activeWindow()).sort('sortOrder -createdAt').lean(),
    Category.find({ active: true }).sort('sortOrder name').lean(),
    Product.find({ visible: true, isBestSeller: true }).select(CARD_FIELDS).populate('category', 'name slug').limit(12).lean(),
    Product.find({ visible: true, isCombo: true }).select(CARD_FIELDS).populate('category', 'name slug').limit(10).lean(),
    Product.find({ visible: true, isExotic: true }).select(CARD_FIELDS).populate('category', 'name slug').limit(8).lean(),
    BlogPost.find({ active: true, type: 'blog' }).sort('-publishedAt').limit(3).select('-content').lean(),
  ]);
  ok(res, { settings, banners, categories, bestSellers, combos, exotic, blogs });
});

export const siteSettings = ah(async (_req, res) => ok(res, { settings: await getPublicSettings() }));
export const listCategories = ah(async (_req, res) => ok(res, { items: await Category.find({ active: true }).sort('sortOrder name').lean() }));
export const getCategory = ah(async (req, res) => {
  const c = await Category.findOne({ slug: req.params.slug, active: true }).lean();
  if (!c) throw new ApiError(404, 'Category not found');
  ok(res, { category: c });
});
export const listCollections = ah(async (_req, res) => ok(res, { items: await Collection.find({ active: true }).sort('sortOrder name').lean() }));
export const listBanners = ah(async (req, res) => {
  const f = activeWindow();
  if (req.query.position) f.position = req.query.position;
  ok(res, { items: await Banner.find(f).sort('sortOrder -createdAt').lean() });
});

export const listBlog = ah(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query, 9);
  const filter = { active: true, ...(req.query.type ? { type: req.query.type } : {}) };
  const [items, total] = await Promise.all([BlogPost.find(filter).sort('-publishedAt').skip(skip).limit(limit).select('-content').lean(), BlogPost.countDocuments(filter)]);
  ok(res, { items }, 200, { pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
export const getBlog = ah(async (req, res) => {
  const p = await BlogPost.findOne({ slug: req.params.slug, active: true }).lean();
  if (!p) throw new ApiError(404, 'Article not found');
  ok(res, { post: p });
});

export const checkPincode = ah(async (req, res) => {
  if (!/^[1-9]\d{5}$/.test(req.params.pincode)) throw new ApiError(400, 'Enter a valid 6 digit pincode');
  const eta = estimateDelivery(req.params.pincode);
  ok(res, { serviceable: true, days: eta.days, estimatedDelivery: eta.date });
});

// ---- cart ----
export const priceItems = ah(async (req, res) => ok(res, await priceCart(req.body.items, { couponCode: req.body.couponCode, userId: req.user?._id })));

export const getCart = ah(async (req, res) => {
  const items = req.user.cart.map((c) => ({ productId: c.productId, variantId: c.variantId, quantity: c.quantity }));
  ok(res, { items });
});
export const saveCart = ah(async (req, res) => {
  req.user.cart = req.body.items;
  await req.user.save();
  ok(res, { items: req.user.cart });
});
export const mergeCart = ah(async (req, res) => {
  const map = new Map(req.user.cart.map((c) => [`${c.productId}:${c.variantId}`, { productId: String(c.productId), variantId: c.variantId, quantity: c.quantity }]));
  for (const i of req.body.items) {
    const k = `${i.productId}:${i.variantId}`;
    const cur = map.get(k);
    map.set(k, { ...i, quantity: Math.min(50, (cur?.quantity || 0) + i.quantity) });
  }
  req.user.cart = [...map.values()];
  await req.user.save();
  ok(res, { items: req.user.cart });
});

export const availableCoupons = ah(async (_req, res) => {
  const items = await Coupon.find({ active: true, $and: [{ $or: [{ expiresAt: null }, { expiresAt: { $gte: now() } }] }, { $or: [{ startsAt: null }, { startsAt: { $lte: now() } }] }] })
    .select('code description type value minOrder maxDiscount').lean();
  ok(res, { items });
});
export const validateCoupon = ah(async (req, res) => {
  const p = await priceCart(req.body.items, { couponCode: req.body.couponCode, userId: req.user?._id });
  if (!p.coupon) throw new ApiError(400, p.couponError || 'Invalid coupon');
  ok(res, { coupon: { code: p.coupon.code, discount: p.coupon.discount, description: p.coupon.description } });
});
export { evaluateCoupon };

// ---- wishlist ----
export const getWishlist = ah(async (req, res) => {
  const u = await User.findById(req.user._id).populate({ path: 'wishlist', match: { visible: true }, select: CARD_FIELDS, populate: { path: 'category', select: 'name slug' } });
  ok(res, { items: u.wishlist });
});
export const addWishlist = ah(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id) || !(await Product.exists({ _id: req.params.id }))) throw new ApiError(404, 'Product not found');
  await User.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: req.params.id } });
  ok(res, {});
});
export const removeWishlist = ah(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $pull: { wishlist: req.params.id } });
  ok(res, {});
});
export const mergeWishlist = ah(async (req, res) => {
  const ids = (req.body.ids || []).filter((i) => mongoose.isValidObjectId(i)).slice(0, 100);
  await User.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: { $each: ids } } });
  const u = await User.findById(req.user._id);
  ok(res, { ids: u.wishlist.map(String) });
});
export const wishlistIds = ah(async (req, res) => ok(res, { ids: req.user.wishlist.map(String) }));

// ---- reviews / contact / newsletter ----
export const canReview = ah(async (req, res) => {
  const bought = await Order.exists({ user: req.user._id, 'items.productId': req.params.id, orderStatus: { $ne: 'Cancelled' } });
  const done = await Review.findOne({ user: req.user._id, product: req.params.id }).select('status');
  ok(res, { canReview: Boolean(bought) && !done, purchased: Boolean(bought), existing: done?.status || null });
});
export const createReview = ah(async (req, res) => {
  const { productId, rating, comment } = req.body;
  const bought = await Order.exists({ user: req.user._id, 'items.productId': productId, orderStatus: { $ne: 'Cancelled' } });
  if (!bought) throw new ApiError(403, 'Only customers who purchased this product can review it');
  if (await Review.exists({ user: req.user._id, product: productId })) throw new ApiError(409, 'You have already reviewed this product');
  await Review.create({ product: productId, user: req.user._id, name: req.user.name, rating, comment, verified: true });
  ok(res, { message: 'Thanks! Your review will appear once approved.' }, 201);
});

export const sendContact = ah(async (req, res) => {
  const m = await ContactMessage.create(req.body);
  emails.contactReceived(m);
  ok(res, { message: 'Thanks for reaching out. We will reply soon.' }, 201);
});
export const subscribe = ah(async (req, res) => {
  const existing = await NewsletterSubscriber.findOne({ email: req.body.email });
  if (existing?.active) throw new ApiError(409, 'You are already subscribed');
  if (existing) { existing.active = true; await existing.save(); } else await NewsletterSubscriber.create({ email: req.body.email });
  emails.newsletterWelcome(req.body.email);
  ok(res, { message: 'You are subscribed. Thank you!' }, 201);
});
