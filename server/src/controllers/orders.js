import { Order } from '../models/Order.js';
import { ApiError, ah, ok, pageParams } from '../utils/http.js';
import { createOrder, verifyPayment, cancelOrder, publicOrder } from '../services/orders.js';
import { buildInvoice } from '../services/pdf.js';
import { emails } from '../services/email.js';

export const place = ah(async (req, res) => {
  const { order, razorpay } = await createOrder(req.user, req.body);
  ok(res, { order: publicOrder(order), razorpay }, 201);
});
export const verify = ah(async (req, res) => ok(res, { order: publicOrder(await verifyPayment(req.user, req.body)) }));

export const paymentFailed = ah(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.paymentStatus !== 'Paid') await cancelOrder(order, 'Payment was not completed', 'customer');
  ok(res, { order: publicOrder(order) });
});

export const myOrders = ah(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query, 10);
  const filter = { user: req.user._id };
  const [items, total] = await Promise.all([Order.find(filter).sort('-createdAt').skip(skip).limit(limit).lean(), Order.countDocuments(filter)]);
  ok(res, { items }, 200, { pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

async function owned(req) {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber, ...(['admin', 'superadmin'].includes(req.user.role) ? {} : { user: req.user._id }) });
  if (!order) throw new ApiError(404, 'Order not found');
  return order;
}
export const myOrder = ah(async (req, res) => ok(res, { order: publicOrder(await owned(req)) }));

export const cancelMine = ah(async (req, res) => {
  const order = await owned(req);
  if (!['Pending', 'Confirmed'].includes(order.orderStatus)) throw new ApiError(400, 'This order can no longer be cancelled. Please contact support.');
  await cancelOrder(order, 'Cancelled by customer', 'customer');
  emails.orderStatus(order);
  ok(res, { order: publicOrder(order) });
});

export const invoice = ah(async (req, res) => {
  const order = await owned(req);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="MS-Punjabi-Dry-Fruits-${order.orderNumber}.pdf"`);
  await buildInvoice(order, res);
});
