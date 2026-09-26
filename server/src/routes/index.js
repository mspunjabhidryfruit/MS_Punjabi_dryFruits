import { Router } from "express";
import rateLimit from "express-rate-limit";
import { protect, optionalAuth, adminOnly } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";
import * as V from "../validators/index.js";
import * as auth from "../controllers/auth.js";
import * as shop from "../controllers/shop.js";
import * as orders from "../controllers/orders.js";
import * as admin from "../controllers/admin.js";
import {
  Category,
  Collection,
  Banner,
  BlogPost,
  Coupon,
} from "../controllers/admin.js";

const r = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again in a few minutes.",
  },
});
const formLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please slow down." },
});

r.get("/health", (_req, res) =>
  res.json({
    success: true,
    data: { status: "ok", time: new Date().toISOString() },
  }),
);

// auth
r.post(
  "/auth/register",
  authLimiter,
  validate(V.registerSchema),
  auth.register,
);
r.post("/auth/login", authLimiter, validate(V.loginSchema), auth.login);
r.post(
  "/auth/admin/login",
  authLimiter,
  validate(V.loginSchema),
  auth.adminLogin,
);
r.get("/auth/me", protect, auth.me);
r.put("/auth/profile", protect, validate(V.profileSchema), auth.updateProfile);
r.post("/auth/forgot-password", authLimiter, auth.forgotPassword);
r.post("/auth/reset-password/:token", authLimiter, auth.resetPassword);

// catalogue
r.get("/home", shop.home);
r.get("/settings", shop.siteSettings);
r.get("/products", shop.listProducts);
r.get("/products/:slug", shop.getProduct);
r.get("/categories", shop.listCategories);
r.get("/categories/:slug", shop.getCategory);
r.get("/collections", shop.listCollections);
r.get("/banners", shop.listBanners);
r.get("/blog", shop.listBlog);
r.get("/blog/:slug", shop.getBlog);
r.get("/pincode/:pincode", shop.checkPincode);

// cart & wishlist & coupons
r.post("/cart/price", optionalAuth, validate(V.priceSchema), shop.priceItems);
r.get("/cart", protect, shop.getCart);
r.put(
  "/cart",
  protect,
  validate(V.priceSchema.pick({ items: true })),
  shop.saveCart,
);
r.post(
  "/cart/merge",
  protect,
  validate(V.priceSchema.pick({ items: true })),
  shop.mergeCart,
);
r.get("/coupons", shop.availableCoupons);
r.post(
  "/coupons/validate",
  optionalAuth,
  validate(V.priceSchema),
  shop.validateCoupon,
);
r.get("/wishlist", protect, shop.getWishlist);
r.get("/wishlist/ids", protect, shop.wishlistIds);
r.post("/wishlist/merge", protect, shop.mergeWishlist);
r.post("/wishlist/:id", protect, shop.addWishlist);
r.delete("/wishlist/:id", protect, shop.removeWishlist);

// orders & payments
r.post("/orders", protect, validate(V.orderSchema), orders.place);
r.get("/orders", protect, orders.myOrders);
r.get("/orders/:orderNumber", protect, orders.myOrder);
r.get("/orders/:orderNumber/invoice", protect, orders.invoice);
r.post("/orders/:orderNumber/cancel", protect, orders.cancelMine);
r.post("/payments/verify", protect, validate(V.verifySchema), orders.verify);
r.post("/payments/:orderNumber/failed", protect, orders.paymentFailed);

// engagement
r.get("/reviews/can/:id", protect, shop.canReview);
r.post("/reviews", protect, validate(V.reviewSchema), shop.createReview);
r.post("/contact", formLimiter, validate(V.contactSchema), shop.sendContact);
r.post(
  "/newsletter",
  formLimiter,
  validate(V.newsletterSchema),
  shop.subscribe,
);

// ---------------- admin ----------------
const a = Router();
a.use(adminOnly);
a.get("/dashboard", admin.dashboard);
a.post("/upload", upload.array("images", 8), admin.uploadImages);
a.post("/upload/delete", admin.removeImage);

const mount = (path, c, mw = []) => {
  a.get(path, c.list);
  a.post(path, ...mw, c.create);
  a.get(`${path}/:id`, c.get);
  a.put(`${path}/:id`, ...mw, c.update);
  a.delete(`${path}/:id`, c.remove);
};
mount("/products", admin.adminProducts, [validate(V.productSchema)]);
mount(
  "/categories",
  admin.crud(Category, { slugFrom: "name", sort: "sortOrder name" }),
);
mount(
  "/collections",
  admin.crud(Collection, { slugFrom: "name", sort: "sortOrder name" }),
);
mount(
  "/banners",
  admin.crud(Banner, { sort: "position sortOrder", searchFields: ["title"] }),
);
mount(
  "/coupons",
  admin.crud(Coupon, {
    schema: V.couponSchema,
    searchFields: ["code"],
    imageFields: [],
  }),
);
mount(
  "/blog",
  admin.crud(BlogPost, {
    slugFrom: "title",
    sort: "-publishedAt",
    searchFields: ["title"],
  }),
);
// crud() returns list/get/create/update/remove; mount() above expects those names.

a.get("/orders", admin.adminOrders.list);
a.get("/orders/:id", admin.adminOrders.get);
a.put("/orders/:id/status", validate(V.statusSchema), admin.adminOrders.status);
a.put("/orders/:id/payment", admin.adminOrders.paymentStatus);
a.post("/orders/:id/notify", admin.adminOrders.notify);
a.get("/orders/:id/invoice", admin.adminOrders.invoice);
a.get("/orders/:id/shipping", admin.adminOrders.shipping);

a.get("/customers", admin.customers.list);
a.get("/customers/:id", admin.customers.get);
a.put("/customers/:id/toggle", admin.customers.toggle);
a.get("/reviews", admin.reviews.list);
a.put("/reviews/:id", admin.reviews.setStatus);
a.delete("/reviews/:id", admin.reviews.remove);
a.get("/messages", admin.messages.list);
a.put("/messages/:id", admin.messages.setStatus);
a.delete("/messages/:id", admin.messages.remove);
a.get("/newsletter", admin.newsletter.list);
a.get("/newsletter/export", admin.newsletter.csv);
a.put("/newsletter/:id/toggle", admin.newsletter.toggle);
a.delete("/newsletter/:id", admin.newsletter.remove);
a.get("/settings", admin.settings.get);
a.put("/settings", admin.settings.update);

r.use("/admin", a);
export default r;
