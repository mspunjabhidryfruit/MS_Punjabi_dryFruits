import { Resend } from "resend";
import { env } from "../config/env.js";
import { inr } from "../utils/http.js";

const resend = env.resendKey ? new Resend(env.resendKey) : null;
const brand = {
  brown: "#8c3d20",
  cream: "#fdf9e4",
  beige: "#ebd8c1",
  yellow: "#ffd02b",
  green: "#123b14",
};
const esc = (s = "") =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const clientUrl = () => env.clientUrls[0];

export async function sendEmail({ to, subject, html }) {
  if (!to) return false;
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY not set - skipped "${subject}" to ${to}`,
    );
    return false;
  }
  try {
    const { error } = await resend.emails.send({
      from: env.emailFrom,
      to,
      subject,
      html,
    });
    if (error) throw new Error(error.message);
    return true;
  } catch (e) {
    console.error(`[email] failed "${subject}" -> ${to}: ${e.message}`);
    return false;
  }
}

const layout = (
  title,
  body,
) => `<!doctype html><html><body style="margin:0;background:#f4efe6;font-family:Arial,Helvetica,sans-serif;color:#2b1a10">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:10px;overflow:hidden">
<tr><td style="background:${brand.beige};padding:20px 28px"><span style="font-family:Georgia,serif;font-size:22px;color:${brand.green}">MS Punjabi <span style="color:${brand.brown}">Dry Fruits</span></span></td></tr>
<tr><td style="padding:28px"><h1 style="font-family:Georgia,serif;font-size:26px;margin:0 0 14px;color:${brand.green}">${esc(title)}</h1>${body}</td></tr>
<tr><td style="background:${brand.cream};padding:18px 28px;font-size:12px;color:#6b5a4a">MS Punjabi Dry Fruits - Premium dry fruits, nuts &amp; healthy snacks.<br>Questions? Reply to this email.</td></tr>
</table></td></tr></table></body></html>`;

const button = (href, label, primary = true) =>
  `<a href="${href}" style="display:inline-block;margin:6px 8px 6px 0;padding:12px 22px;border-radius:24px;text-decoration:none;font-weight:bold;font-size:14px;${primary ? `background:${brand.yellow};color:#2b1a10` : `border:1px solid ${brand.brown};color:${brand.brown}`}">${label}</a>`;

function orderTable(o) {
  const rows = o.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${esc(i.name)}<br><span style="color:#8a7a6a;font-size:12px">${esc(i.weight)} x ${i.quantity}</span></td><td align="right" style="padding:8px 0;border-bottom:1px solid #eee">${inr(i.lineTotal)}</td></tr>`,
    )
    .join("");
  const line = (l, v) =>
    `<tr><td style="padding:3px 0;color:#6b5a4a">${l}</td><td align="right">${v}</td></tr>`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}
  <tr><td colspan="2" style="padding-top:12px"><table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
  ${line("Subtotal", inr(o.subtotal))}${o.discount ? line(`Discount (${esc(o.coupon?.code)})`, `- ${inr(o.discount)}`) : ""}${line("Delivery", o.deliveryCharge ? inr(o.deliveryCharge) : "Free")}${o.tax ? line("Tax", inr(o.tax)) : ""}
  <tr><td style="padding-top:8px;font-weight:bold">Total</td><td align="right" style="padding-top:8px;font-weight:bold;font-size:17px">${inr(o.grandTotal)}</td></tr></table></td></tr></table>`;
}
const addressBlock = (a) =>
  `${esc(a.name)}<br>${esc(a.line1)}${a.line2 ? `, ${esc(a.line2)}` : ""}<br>${esc(a.city)}, ${esc(a.state)} - ${esc(a.pincode)}<br>Phone: ${esc(a.phone)}`;
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const emails = {
  welcome: (user) =>
    sendEmail({
      to: user.email,
      subject: "Welcome to MS Punjabi Dry Fruits",
      html: layout(
        `Welcome, ${user.name.split(" ")[0]}!`,
        `<p>Your account is ready. Explore premium almonds, cashews, seeds and more, with free delivery on orders above Rs. 300.</p>${button(clientUrl() + "/products", "Start shopping")}`,
      ),
    }),
  passwordReset: (user, token) => {
    const resetUrl = `${clientUrl()}/reset-password/${encodeURIComponent(token)}`;

    return sendEmail({
      to: user.email,
      subject: "Reset your MS Punjabi Dry Fruits password",
      html: layout(
        "Reset your password",
        `
          <p>Hi ${esc(user.name?.split(" ")[0] || "there")},</p>

          <p>
            We received a request to reset the password for your
            MS Punjabi Dry Fruits account.
          </p>

          <p>
            Click the button below to create a new password.
            This link will expire in <b>15 minutes</b>.
          </p>

          <p style="margin:24px 0">
            ${button(resetUrl, "Reset Password")}
          </p>

          <p style="font-size:13px;color:#6b5a4a">
            If you did not request a password reset, you can safely ignore
            this email. Your password will not change.
          </p>

          <p style="font-size:12px;color:#8a7a6a;word-break:break-all">
            If the button does not work, copy and paste this link into your browser:<br>
            ${esc(resetUrl)}
          </p>
        `,
      ),
    });
  },
  orderConfirmation: (o) =>
    sendEmail({
      to: o.customer.email,
      subject: `Order Confirmed - ${o.orderNumber}`,
      html: layout(
        "Order Confirmed",
        `<p>Hi ${esc(o.customer.name)}, thank you for your order. We are getting it ready.</p>
      <p style="background:${brand.cream};padding:12px 14px;border-radius:8px;font-size:14px"><b>Order number:</b> ${o.orderNumber}<br><b>Payment:</b> ${o.paymentMethod === "COD" ? "Cash on Delivery" : `Razorpay (${o.paymentStatus})`}<br><b>Estimated delivery:</b> ${o.estimatedDelivery ? fmtDate(o.estimatedDelivery) : "within 3-7 days"}</p>
      ${orderTable(o)}<p style="font-size:14px"><b>Shipping address</b><br>${addressBlock(o.shippingAddress)}</p>
      ${button(`${clientUrl()}/account/orders/${o.orderNumber}`, "Track order")}${button(clientUrl() + "/products", "Continue shopping", false)}`,
      ),
    }),

  paymentConfirmation: (o) =>
    sendEmail({
      to: o.customer.email,
      subject: `Payment received - ${o.orderNumber}`,
      html: layout(
        "Payment received",
        `<p>We have received your payment of <b>${inr(o.grandTotal)}</b> for order <b>${o.orderNumber}</b>. Payment ID: ${esc(o.payment?.razorpayPaymentId)}.</p>${button(`${clientUrl()}/account/orders/${o.orderNumber}`, "View order")}`,
      ),
    }),

  orderStatus: (o) => {
    const copy = {
      Confirmed: ["Order confirmed", "Your order has been confirmed."],
      Processing: [
        "Order is being processed",
        "We are packing your order with care.",
      ],
      Shipped: ["Order shipped", "Your order is on its way."],
      "Out for Delivery": [
        "Out for delivery",
        "Your order will reach you today. Please keep your phone handy.",
      ],
      Delivered: [
        "Order delivered",
        "Your order has been delivered. We hope you enjoy it! Loved it? Leave a review on the product page.",
      ],
      Cancelled: [
        "Order cancelled",
        o.paymentStatus === "Refunded" || o.paymentStatus === "Paid"
          ? "Your order has been cancelled. If you paid online, your refund will be processed to the original payment method."
          : "Your order has been cancelled.",
      ],
    }[o.orderStatus];
    if (!copy) return false;
    return sendEmail({
      to: o.customer.email,
      subject: `${copy[0]} - ${o.orderNumber}`,
      html: layout(
        copy[0],
        `<p>Hi ${esc(o.customer.name)}, ${copy[1]}</p><p style="font-size:14px"><b>Order:</b> ${o.orderNumber}<br><b>Total:</b> ${inr(o.grandTotal)}</p>${button(`${clientUrl()}/account/orders/${o.orderNumber}`, "Track order")}`,
      ),
    });
  },

  adminNewOrder: (o) =>
    sendEmail({
      to: env.adminEmail,
      subject: `New order ${o.orderNumber} - ${inr(o.grandTotal)}`,
      html: layout(
        "New order received",
        `<p><b>${esc(o.customer.name)}</b> (${esc(o.customer.phone)}) placed order <b>${o.orderNumber}</b> via ${o.paymentMethod}.</p>${orderTable(o)}<p style="font-size:14px">${addressBlock(o.shippingAddress)}</p>${button(`${clientUrl()}/admin/orders/${o._id}`, "Open in admin")}`,
      ),
    }),

  adminPayment: (o) =>
    sendEmail({
      to: env.adminEmail,
      subject: `Payment received for ${o.orderNumber}`,
      html: layout(
        "Payment received",
        `<p>${inr(o.grandTotal)} received for ${o.orderNumber}. Razorpay payment ${esc(o.payment?.razorpayPaymentId)}.</p>${button(`${clientUrl()}/admin/orders/${o._id}`, "Open in admin")}`,
      ),
    }),

  adminStatus: (o) =>
    sendEmail({
      to: env.adminEmail,
      subject: `Order ${o.orderNumber} is now ${o.orderStatus}`,
      html: layout(
        `Order ${o.orderStatus}`,
        `<p>Order ${o.orderNumber} moved to <b>${o.orderStatus}</b>.</p>`,
      ),
    }),

  newsletterWelcome: (email) =>
    sendEmail({
      to: email,
      subject: "You are subscribed - MS Punjabi Dry Fruits",
      html: layout(
        "Thanks for subscribing",
        `<p>You will now hear from us about new arrivals, festive combos and limited period offers.</p>${button(clientUrl() + "/products", "Browse products")}`,
      ),
    }),

  contactReceived: (m) =>
    Promise.all([
      sendEmail({
        to: m.email,
        subject: "We received your message",
        html: layout(
          "We are happy to help",
          `<p>Hi ${esc(m.name)}, thanks for writing to us. Our team will get back to you shortly.</p>`,
        ),
      }),
      sendEmail({
        to: env.adminEmail,
        subject: `New contact message from ${m.name}`,
        html: layout(
          "New contact message",
          `<p><b>${esc(m.name)}</b> - ${esc(m.email)} - ${esc(m.phone)}</p><p>${esc(m.message)}</p>`,
        ),
      }),
    ]),
};
