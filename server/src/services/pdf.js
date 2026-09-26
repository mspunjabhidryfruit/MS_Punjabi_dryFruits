import PDFDocument from 'pdfkit';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getSettings } from './settings.js';

const logoPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../assets/logo.jpg');
const BROWN = '#8c3d20';
const GREEN = '#123b14';
const rs = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dt = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function header(doc, title, settings) {
  if (fs.existsSync(logoPath)) doc.image(logoPath, 40, 34, { width: 70 });
  doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(18).text('MS Punjabi Dry Fruits', 125, 40);
  doc.fillColor('#555').font('Helvetica').fontSize(9)
    .text(settings.address || 'Premium dry fruits, nuts, seeds and healthy snacks', 125, 62, { width: 260 })
    .text([settings.email, settings.phone].filter(Boolean).join('  |  '), 125, doc.y + 2);
  doc.fillColor(BROWN).font('Helvetica-Bold').fontSize(24).text(title, 330, 40, { width: 225, align: 'right' });
  doc.moveTo(40, 115).lineTo(555, 115).strokeColor(BROWN).lineWidth(1.2).stroke();
}

export async function buildInvoice(order, stream) {
  const settings = await getSettings();
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(stream);
  header(doc, 'INVOICE', settings);

  let y = 130;
  doc.fillColor('#000').font('Helvetica-Bold').fontSize(10).text('Billed to', 40, y).text('Invoice details', 330, y);
  doc.font('Helvetica').fontSize(10).fillColor('#333');
  const a = order.shippingAddress;
  doc.text(`${a.name}\n${a.line1}${a.line2 ? `, ${a.line2}` : ''}\n${a.city}, ${a.state} - ${a.pincode}\nPhone: ${a.phone}\n${order.customer.email}`, 40, y + 14, { width: 260 });
  doc.text(`Order No: ${order.orderNumber}\nDate: ${dt(order.createdAt)}\nPayment: ${order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Razorpay'} (${order.paymentStatus})\nStatus: ${order.orderStatus}`, 330, y + 14, { width: 225 });

  y = 235;
  const cols = { item: 40, wt: 270, qty: 335, price: 380, disc: 450, total: 510 };
  doc.rect(40, y, 515, 22).fill(GREEN);
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(9);
  doc.text('Item', cols.item + 6, y + 7).text('Weight', cols.wt, y + 7).text('Qty', cols.qty, y + 7)
    .text('Unit price', cols.price, y + 7).text('Saving', cols.disc, y + 7).text('Amount', cols.total, y + 7);
  y += 28;
  doc.font('Helvetica').fillColor('#222').fontSize(9);
  for (const it of order.items) {
    if (y > 730) { doc.addPage(); y = 50; }
    doc.text(it.name, cols.item + 6, y, { width: 220 }).text(it.weight || '-', cols.wt, y, { width: 60 }).text(String(it.quantity), cols.qty, y)
      .text(rs(it.unitPrice), cols.price, y, { width: 65 }).text(rs(it.discount), cols.disc, y, { width: 55 }).text(rs(it.lineTotal), cols.total, y, { width: 50 });
    y = Math.max(doc.y, y + 14) + 6;
    doc.moveTo(40, y - 3).lineTo(555, y - 3).strokeColor('#e5dccf').lineWidth(0.5).stroke();
  }

  y += 8;
  if (y > 660) { doc.addPage(); y = 50; }
  const row = (label, val, bold) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 10).fillColor(bold ? BROWN : '#333')
      .text(label, 350, y, { width: 110 }).text(val, 460, y, { width: 95, align: 'right' });
    y += bold ? 22 : 17;
  };
  row('Subtotal', rs(order.subtotal));
  if (order.discount) row(`Coupon (${order.coupon?.code})`, `- ${rs(order.discount)}`);
  row('Delivery', order.deliveryCharge ? rs(order.deliveryCharge) : 'Free');
  if (order.tax) row('Tax', rs(order.tax));
  doc.moveTo(350, y).lineTo(555, y).strokeColor(BROWN).stroke(); y += 8;
  row('Total', rs(order.grandTotal), true);

  doc.fillColor('#777').font('Helvetica').fontSize(8.5).text('Thank you for shopping with MS Punjabi Dry Fruits. This is a computer generated invoice and does not require a signature.', 40, 780, { width: 515, align: 'center' });
  doc.end();
}

export async function buildShippingLabel(order, stream) {
  const settings = await getSettings();
  const doc = new PDFDocument({ size: 'A5', margin: 30 });
  doc.pipe(stream);
  if (fs.existsSync(logoPath)) doc.image(logoPath, 30, 26, { width: 50 });
  doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(14).text('MS Punjabi Dry Fruits', 90, 30).font('Helvetica').fontSize(8).fillColor('#555')
    .text(`From: ${settings.address || 'MS Punjabi Dry Fruits'}${settings.phone ? `  |  ${settings.phone}` : ''}`, 90, 48, { width: 300 });
  doc.rect(30, 90, doc.page.width - 60, 170).lineWidth(1.5).strokeColor('#000').stroke();
  const a = order.shippingAddress;
  doc.fillColor('#000').font('Helvetica-Bold').fontSize(9).text('SHIP TO', 42, 98);
  doc.fontSize(16).text(a.name, 42, 114);
  doc.font('Helvetica').fontSize(12).text(`${a.line1}${a.line2 ? `, ${a.line2}` : ''}\n${a.city}, ${a.state}`, 42, 138, { width: 330 });
  doc.font('Helvetica-Bold').fontSize(20).text(`PIN ${a.pincode}`, 42, 192);
  doc.fontSize(12).text(`Phone: ${a.phone}`, 42, 222);
  const cod = order.paymentMethod === 'COD';
  doc.rect(30, 275, doc.page.width - 60, 46).fill(cod ? '#ffd02b' : '#dff3e0');
  doc.fillColor('#000').font('Helvetica-Bold').fontSize(cod ? 15 : 13)
    .text(cod ? `CASH ON DELIVERY - Collect ${rs(order.grandTotal)}` : 'PREPAID - Do not collect cash', 30, 290, { width: doc.page.width - 60, align: 'center' });
  doc.fillColor('#333').font('Helvetica').fontSize(10).text(`Order: ${order.orderNumber}    Date: ${dt(order.createdAt)}    Items: ${order.items.reduce((s, i) => s + i.quantity, 0)}`, 30, 340, { width: doc.page.width - 60, align: 'center' });
  doc.end();
}
