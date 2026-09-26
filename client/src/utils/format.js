export const inr = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const date = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
export const dateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');

// Inserts Cloudinary transformations (auto format/quality/width). Local and other URLs pass through.
export function img(url, w = 600) {
  if (!url) return '/img/logo.jpg';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/') && !url.includes('/upload/f_auto')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${w},c_limit/`);
  }
  return url;
}
export const STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
export const cheapestInStock = (p) => {
  const vs = (p.variants || []).filter((v) => v.stock > 0);
  return vs.length ? vs.reduce((a, b) => (a.price <= b.price ? a : b)) : null;
};
export const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
