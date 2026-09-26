export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const ok = (res, data = {}, status = 200, extra = {}) => res.status(status).json({ success: true, data, ...extra });

export const slugify = (s = '') =>
  String(s).toLowerCase().trim().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);

export async function uniqueSlug(Model, base, excludeId) {
  const root = slugify(base) || 'item';
  let slug = root;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    n += 1;
    slug = `${root}-${n}`;
  }
  return slug;
}

export const escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const money = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
export const inr = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function pageParams(query, defLimit = 12, maxLimit = 60) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defLimit));
  return { page, limit, skip: (page - 1) * limit };
}
