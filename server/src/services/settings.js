import { SiteSettings } from '../models/SiteSettings.js';

export const DEFAULT_NAV = [
  ['Nuts', '/category/nuts'], ['Dried', '/category/dried'], ['Roasted Nuts', '/category/roasted-nuts'], ['Seeds', '/category/seeds'],
  ['Dates', '/category/dates'], ['Breakfast Special', '/category/breakfast-special'], ['Royal Choice', '/category/royal-choice'],
  ['Combos', '/category/combos'], ['Gifting', '/category/gifting'], ['About', '/about'], ['Blog', '/blog'], ['News', '/blog?type=news'],
].map(([label, to]) => ({ label, to }));

export async function getSettings() {
  let s = await SiteSettings.findOne({ key: 'main' });
  if (!s) s = await SiteSettings.create({ key: 'main' });
  return s;
}

export async function getPublicSettings() {
  const s = (await getSettings()).toObject();
  delete s._id; delete s.__v; delete s.key;
  if (!s.navLinks?.length) s.navLinks = DEFAULT_NAV;
  return s;
}
