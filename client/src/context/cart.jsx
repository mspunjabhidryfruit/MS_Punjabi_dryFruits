import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { get, post, put, del } from '../services/api.js';
import { useAuth } from './auth.jsx';

const CartCtx = createContext(null);
export const useCart = () => useContext(CartCtx);
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

export function CartProvider({ children }) {
  const { user, ready } = useAuth();
  const [items, setItems] = useState(() => read('msp_cart', []));
  const [coupon, setCoupon] = useState(() => localStorage.getItem('msp_coupon') || '');
  const [priced, setPriced] = useState(null);
  const [pricing, setPricing] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [open, setOpen] = useState(false);
  const [wishIds, setWishIds] = useState(() => read('msp_wish', []));
  const syncedFor = useRef(null);

  const persist = (next) => { setItems(next); localStorage.setItem('msp_cart', JSON.stringify(next)); };

  // Merge guest data into the account on sign in
  useEffect(() => {
    if (!ready) return;
    if (!user) { syncedFor.current = null; return; }
    if (syncedFor.current === user._id) return;
    syncedFor.current = user._id;
    (async () => {
      try {
        const local = read('msp_cart', []);
        const r = local.length ? await post('/cart/merge', { items: local }) : await get('/cart');
        persist(r.data.items.map((i) => ({ productId: String(i.productId), variantId: i.variantId, quantity: i.quantity })));
        const w = read('msp_wish', []);
        const wr = w.length ? await post('/wishlist/merge', { ids: w }) : await get('/wishlist/ids');
        setWishIds(wr.data.ids); localStorage.removeItem('msp_wish');
      } catch { /* the guest cart keeps working */ }
    })();
  }, [user, ready]);

  // Push account cart changes (debounced)
  useEffect(() => {
    if (!user || syncedFor.current !== user._id) return undefined;
    const t = setTimeout(() => put('/cart', { items }).catch(() => {}), 700);
    return () => clearTimeout(t);
  }, [items, user]);

  // Price the cart on the server
  useEffect(() => {
    if (!items.length) { setPriced(null); return undefined; }
    let cancelled = false;
    setPricing(true);
    const t = setTimeout(() => {
      post('/cart/price', { items, couponCode: coupon || undefined })
        .then((r) => {
          if (cancelled) return;
          const d = r.data;
          setPriced(d);
          setCouponError(coupon && !d.coupon ? d.couponError || '' : '');
          if (coupon && !d.coupon) { setCoupon(''); localStorage.removeItem('msp_coupon'); }
          if (d.issues.length) {
            d.issues.forEach((i) => toast(i.message, { icon: '⚠️' }));
            persist(d.lines.map((l) => ({ productId: String(l.productId), variantId: l.variantId, quantity: l.quantity })));
          }
        })
        .catch((e) => { if (!cancelled) toast.error(e.message); })
        .finally(() => { if (!cancelled) setPricing(false); });
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items), coupon]);

  const add = useCallback((productId, variantId, quantity = 1, { openDrawer = true } = {}) => {
    const next = [...items];
    const found = next.find((i) => i.productId === String(productId) && i.variantId === String(variantId));
    if (found) found.quantity = Math.min(50, found.quantity + quantity); else next.push({ productId: String(productId), variantId: String(variantId), quantity });
    persist(next);
    if (openDrawer) setOpen(true);
    toast.success('Added to cart');
  }, [items]);
  const setQty = (productId, variantId, q) => persist(items.map((i) => (i.productId === String(productId) && i.variantId === variantId ? { ...i, quantity: Math.max(1, Math.min(50, q)) } : i)));
  const remove = (productId, variantId) => { persist(items.filter((i) => !(i.productId === String(productId) && i.variantId === variantId))); toast.success('Removed from cart'); };
  const clear = () => { persist([]); setCoupon(''); localStorage.removeItem('msp_coupon'); };
  const applyCoupon = async (code) => {
    const c = code.trim().toUpperCase();
    if (!c) return false;
    try {
      await post('/coupons/validate', { items, couponCode: c });
      setCoupon(c); localStorage.setItem('msp_coupon', c); setCouponError('');
      toast.success(`Coupon ${c} applied`);
      return true;
    } catch (e) { setCouponError(e.message); toast.error(e.message); return false; }
  };
  const removeCoupon = () => { setCoupon(''); localStorage.removeItem('msp_coupon'); toast.success('Coupon removed'); };

  const toggleWish = async (productId) => {
    const id = String(productId);
    const has = wishIds.includes(id);
    const next = has ? wishIds.filter((w) => w !== id) : [...wishIds, id];
    setWishIds(next);
    if (user) {
      try { await (has ? del(`/wishlist/${id}`) : post(`/wishlist/${id}`)); } catch (e) { setWishIds(wishIds); toast.error(e.message); return; }
    } else localStorage.setItem('msp_wish', JSON.stringify(next));
    toast.success(has ? 'Removed from wishlist' : 'Saved to wishlist');
  };

  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  return (
    <CartCtx.Provider value={{ items, priced, pricing, count, coupon, couponError, open, setOpen, add, setQty, remove, clear, applyCoupon, removeCoupon, wishIds, toggleWish }}>
      {children}
    </CartCtx.Provider>
  );
}
