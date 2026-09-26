import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { post, get } from '../services/api.js';
import { useAuth } from '../context/auth.jsx';
import { useCart } from '../context/cart.jsx';
import { img, inr, date } from '../utils/format.js';
import { Seo, Field, Empty, Skeleton } from '../components/Common.jsx';
import { Summary } from './Cart.jsx';

const STATES = ['Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Kerala', 'Maharashtra', 'Gujarat', 'Rajasthan', 'Delhi', 'Punjab', 'Haryana', 'Uttar Pradesh', 'Madhya Pradesh', 'West Bengal', 'Bihar', 'Odisha', 'Assam', 'Chandigarh', 'Goa', 'Jammu and Kashmir', 'Uttarakhand', 'Himachal Pradesh', 'Jharkhand', 'Chhattisgarh', 'Other'];

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = resolve; s.onerror = () => reject(new Error('Could not load the payment window. Check your connection.'));
    document.body.appendChild(s);
  });
}

export default function Checkout() {
  const { user, ready } = useAuth();
  const { items, priced, pricing, coupon, couponError, applyCoupon, removeCoupon, clear } = useCart();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', phone: '', line1: '', line2: '', city: '', state: 'Andhra Pradesh', pincode: '' });
  const [method, setMethod] = useState('COD');
  const [notes, setNotes] = useState('');
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const [eta, setEta] = useState(null);

  useEffect(() => { if (user) setF((x) => ({ ...x, name: x.name || user.name, phone: x.phone || user.phone || '' })); }, [user]);
  useEffect(() => { if (/^[1-9]\d{5}$/.test(f.pincode)) get(`/pincode/${f.pincode}`).then((r) => setEta(r.data)).catch(() => setEta(null)); else setEta(null); }, [f.pincode]);

  if (!ready) return <div className="container page"><Skeleton h={300} /></div>;
  if (!user) return <Navigate to="/login?next=/checkout" replace />;
  if (!items.length) return <div className="container page"><Empty title="Your cart is empty" action={<Link className="btn btn-yellow" to="/products">Continue shopping</Link>}>Add items before checking out.</Empty></div>;

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const validate = () => {
    const e = {};
    if (f.name.trim().length < 2) e.name = 'Enter your full name';
    if (!/^(\+91[\s-]?)?[6-9]\d{9}$/.test(f.phone.trim())) e.phone = 'Enter a valid 10 digit mobile number';
    if (f.line1.trim().length < 3) e.line1 = 'Enter your address';
    if (f.city.trim().length < 2) e.city = 'Enter your city';
    if (!/^[1-9]\d{5}$/.test(f.pincode)) e.pincode = 'Enter a valid 6 digit pincode';
    setErrs(e);
    return !Object.keys(e).length;
  };

  const finish = (no) => { clear(); nav(`/order-confirmation/${no}`, { replace: true }); };

  const place = async (ev) => {
    ev.preventDefault();
    if (!validate()) { toast.error('Please fix the highlighted fields'); return; }
    setBusy(true);
    try {
      const r = await post('/orders', { items, couponCode: coupon || undefined, shippingAddress: f, paymentMethod: method, notes: notes || undefined });
      const { order, razorpay } = r.data;
      if (method === 'COD') { finish(order.orderNumber); return; }
      await loadRazorpay();
      let settled = false;
      const fail = async (msg) => { if (settled) return; settled = true; try { await post(`/payments/${order.orderNumber}/failed`); } catch { /* order already handled */ } toast.error(msg); setBusy(false); };
      const rz = new window.Razorpay({
        key: razorpay.keyId, amount: razorpay.amount, currency: razorpay.currency, order_id: razorpay.orderId, name: 'MS Punjabi Dry Fruits', description: `Order ${order.orderNumber}`,
        image: `${window.location.origin}/img/logo.jpg`, prefill: { name: f.name, email: user.email, contact: f.phone }, theme: { color: '#8c3d20' },
        handler: async (resp) => {
          settled = true;
          try { await post('/payments/verify', resp); finish(order.orderNumber); } catch (e) { toast.error(e.message); nav(`/account/orders/${order.orderNumber}`); }
        },
        modal: { ondismiss: () => fail('Payment cancelled. Your items are still in the cart.') },
      });
      rz.on('payment.failed', (x) => fail(x.error?.description || 'Payment failed. Please try again.'));
      rz.open();
    } catch (e) { toast.error(e.message); setBusy(false); }
  };

  return (
    <div className="container page">
      <Seo title="Checkout" description="Complete your order." />
      <h1>Checkout</h1>
      <form className="two-col" onSubmit={place} noValidate>
        <div className="form-stack">
          <div className="card form-stack"><h3>Contact &amp; shipping</h3>
            <div className="grid-2"><Field label="Full name" id="n" error={errs.name}><input id="n" className="input" value={f.name} onChange={set('name')} autoComplete="name" /></Field>
              <Field label="Mobile number" id="ph" error={errs.phone}><input id="ph" className="input" inputMode="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" /></Field></div>
            <Field label="Email" id="em"><input id="em" className="input" value={user.email} readOnly /></Field>
            <Field label="Address" id="a1" error={errs.line1}><input id="a1" className="input" value={f.line1} onChange={set('line1')} autoComplete="address-line1" placeholder="House no, street, area" /></Field>
            <Field label="Apartment, landmark (optional)" id="a2"><input id="a2" className="input" value={f.line2} onChange={set('line2')} /></Field>
            <div className="grid-2"><Field label="City" id="c" error={errs.city}><input id="c" className="input" value={f.city} onChange={set('city')} autoComplete="address-level2" /></Field>
              <Field label="State" id="s"><select id="s" className="select" value={f.state} onChange={set('state')}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></Field></div>
            <Field label="Pincode" id="pc" error={errs.pincode}><input id="pc" className="input" inputMode="numeric" maxLength={6} value={f.pincode} onChange={(e) => setF({ ...f, pincode: e.target.value.replace(/\D/g, '') })} autoComplete="postal-code" /></Field>
            {eta && <div style={{ fontSize: 12, color: '#2e7d32' }}>Estimated delivery by {date(eta.estimatedDelivery)}</div>}
            <Field label="Order notes (optional)" id="no"><input id="no" className="input" maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          </div>
          <div className="card"><h3 style={{ marginBottom: 12 }}>Payment</h3>
            {[['COD', 'Cash on Delivery', 'Pay when your order arrives.'], ['Razorpay', 'Pay online', 'UPI, cards, netbanking and wallets via Razorpay.']].map(([v, t, d]) => (
              <label key={v} className={`pay-opt ${method === v ? 'on' : ''}`}><input type="radio" name="pm" checked={method === v} onChange={() => setMethod(v)} /><div><b>{t}</b><div className="muted" style={{ fontSize: 12 }}>{d}</div></div></label>
            ))}
          </div>
        </div>
        <div className="card" style={{ position: 'sticky', top: 150 }}>
          <h3 style={{ marginBottom: 8 }}>Order summary</h3>
          {!priced ? <Skeleton h={120} /> : <>
            {priced.lines.map((l) => <div className="mini-item" key={l.productId + l.variantId}><img src={img(l.image, 120)} alt="" /><div style={{ flex: 1 }}>{l.name}<div className="muted" style={{ fontSize: 11 }}>{l.weight} × {l.quantity}</div></div><b>{inr(l.lineTotal)}</b></div>)}
            <div className="flex gap mt" style={{ alignItems: 'flex-start' }}>
              <input className="input" placeholder="Coupon code" aria-label="Coupon code" value={coupon || code} readOnly={Boolean(coupon)} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={30} />
              {coupon ? <button type="button" className="btn btn-outline btn-sm" onClick={removeCoupon}>Remove</button> : <button type="button" className="btn btn-outline btn-sm" style={{ height: 40 }} onClick={async () => { if (await applyCoupon(code)) setCode(''); }}>Apply</button>}
            </div>
            {couponError && <div className="field-error">{couponError}</div>}
            <div className="mt"><Summary priced={priced} /></div>
            <button className="btn btn-yellow btn-block mt" type="submit" disabled={busy || pricing}>{busy ? 'Processing...' : method === 'COD' ? `Place order · ${inr(priced.total)}` : `Pay ${inr(priced.total)}`}</button>
            <p className="muted center" style={{ fontSize: 11 }}>Prices, stock and totals are re-checked securely when you place the order.</p>
          </>}
        </div>
      </form>
    </div>
  );
}
