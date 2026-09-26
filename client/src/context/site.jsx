import { createContext, useContext, useEffect, useState } from 'react';
import { get } from '../services/api.js';

const FALLBACK = {
  storeName: 'MS Punjabi Dry Fruits', logo: '/img/logo.jpg', freeDeliveryThreshold: 300, deliveryCharge: 49, announcements: [], faqs: [], testimonials: [], stats: [], purposes: [], social: {}, popup: { enabled: false, offers: [] },
  navLinks: ['Nuts', 'Dried', 'Roasted Nuts', 'Seeds', 'Dates', 'Breakfast Special', 'Royal Choice', 'Combos', 'Gifting'].map((l) => ({ label: l, to: `/category/${l.toLowerCase().replace(/ /g, '-')}` }))
    .concat([{ label: 'About', to: '/about' }, { label: 'Blog', to: '/blog' }, { label: 'News', to: '/blog?type=news' }]),
};
const Ctx = createContext({ settings: FALLBACK, reload: () => {} });
export const useSite = () => useContext(Ctx);

export function SiteProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK);
  const reload = () => get('/settings').then((r) => setSettings({ ...FALLBACK, ...r.data.settings })).catch(() => {});
  useEffect(() => { reload(); }, []);
  return <Ctx.Provider value={{ settings, reload }}>{children}</Ctx.Provider>;
}
