import { z } from 'zod';

const phone = z.string().trim().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, 'Enter a valid 10 digit mobile number');
const password = z.string().min(8, 'Password must be at least 8 characters').max(72).regex(/[A-Za-z]/, 'Password needs a letter').regex(/\d/, 'Password needs a number');
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  phone,
  password,
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email'), password: z.string().min(1, 'Password is required') });

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: phone.optional(),
  currentPassword: z.string().optional(),
  newPassword: password.optional(),
});

export const cartItems = z.array(z.object({ productId: objectId, variantId: objectId, quantity: z.coerce.number().int().min(1).max(50) })).max(60);
export const priceSchema = z.object({ items: cartItems, couponCode: z.string().trim().max(30).optional() });

export const addressSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone,
  line1: z.string().trim().min(3, 'Enter your address').max(200),
  line2: z.string().trim().max(200).optional().default(''),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a valid 6 digit pincode'),
});
export const orderSchema = z.object({
  items: cartItems.min(1, 'Your cart is empty'),
  couponCode: z.string().trim().max(30).optional(),
  shippingAddress: addressSchema,
  paymentMethod: z.enum(['COD', 'Razorpay']),
  notes: z.string().trim().max(300).optional(),
});
export const verifySchema = z.object({ razorpay_order_id: z.string(), razorpay_payment_id: z.string(), razorpay_signature: z.string() });

export const reviewSchema = z.object({ productId: objectId, rating: z.coerce.number().int().min(1).max(5), comment: z.string().trim().min(5, 'Please write a few words').max(1200) });
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  phone: z.string().trim().max(20).optional().default(''),
  message: z.string().trim().min(5, 'Please write a message').max(3000),
});
export const newsletterSchema = z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email') });

const variant = z.object({
  _id: objectId.optional(),
  weight: z.string().trim().min(1).max(30),
  price: z.coerce.number().min(0),
  mrp: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0),
  sku: z.string().trim().max(40).optional(),
}).refine((v) => !v.mrp || v.mrp >= v.price, { message: 'MRP must be greater than or equal to the price', path: ['mrp'] });
const img = z.object({ url: z.string().min(1), publicId: z.string().optional() });
export const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  shortDescription: z.string().trim().max(240).optional().default(''),
  description: z.string().trim().max(8000).optional().default(''),
  benefits: z.array(z.string().trim().min(1)).max(12).optional().default([]),
  highlights: z.array(z.string().trim().min(1)).max(12).optional().default([]),
  images: z.array(img).max(10).default([]),
  category: objectId,
  collections: z.array(objectId).optional().default([]),
  tags: z.array(z.string().trim().min(1)).max(20).optional().default([]),
  variants: z.array(variant).min(1, 'Add at least one weight option'),
  packLabel: z.string().trim().max(30).optional().default('Pack of 1'),
  badge: z.string().trim().max(30).optional().default(''),
  visible: z.boolean().optional().default(true),
  isBestSeller: z.boolean().optional().default(false),
  isCombo: z.boolean().optional().default(false),
  isExotic: z.boolean().optional().default(false),
  featured: z.boolean().optional().default(false),
});

export const couponSchema = z.object({
  code: z.string().trim().min(3).max(30),
  description: z.string().trim().max(200).optional().default(''),
  type: z.enum(['percent', 'fixed']),
  value: z.coerce.number().positive(),
  minOrder: z.coerce.number().min(0).optional().default(0),
  maxDiscount: z.coerce.number().min(0).optional().default(0),
  startsAt: z.coerce.date().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  active: z.boolean().optional().default(true),
  usageLimit: z.coerce.number().int().min(0).optional().default(0),
  perUserLimit: z.coerce.number().int().min(0).optional().default(0),
}).refine((d) => d.type !== 'percent' || d.value <= 100, { message: 'Percentage cannot exceed 100', path: ['value'] });

export const statusSchema = z.object({ status: z.enum(['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']), note: z.string().trim().max(300).optional().default('') });
