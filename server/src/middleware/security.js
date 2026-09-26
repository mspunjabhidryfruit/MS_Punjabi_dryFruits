// Removes Mongo operators from user input and strips HTML tags from strings.
const SKIP_KEYS = new Set(['password', 'currentPassword', 'newPassword', 'confirmPassword', 'razorpay_signature']);

function clean(value, key) {
  if (typeof value === 'string') {
    return SKIP_KEYS.has(key) ? value : value.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '');
  }
  if (Array.isArray(value)) return value.map((v) => clean(v, key));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      out[k] = clean(v, k);
    }
    return out;
  }
  return value;
}

export function sanitize(req, _res, next) {
  if (req.body && typeof req.body === 'object') req.body = clean(req.body);
  if (req.query && typeof req.query === 'object') {
    const q = clean({ ...req.query });
    for (const k of Object.keys(req.query)) delete req.query[k];
    Object.assign(req.query, q);
  }
  next();
}
