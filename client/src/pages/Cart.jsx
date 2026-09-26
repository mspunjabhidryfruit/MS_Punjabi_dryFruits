import { Link, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useCart } from '../context/cart.jsx';
import { img, inr } from '../utils/format.js';
import { Seo, Empty, Skeleton } from '../components/Common.jsx';

export function Summary({ priced }) {
  if (!priced) return null;
  return (
    <div>
      <div className="sum-line"><span>Subtotal</span><span>{inr(priced.subtotal)}</span></div>
      {priced.savings > 0 && <div className="sum-line" style={{ color: '#2e7d32' }}><span>You save</span><span>{inr(priced.savings)}</span></div>}
      {priced.discount > 0 && <div className="sum-line"><span>Coupon ({priced.coupon.code})</span><span>- {inr(priced.discount)}</span></div>}
      <div className="sum-line"><span>Delivery</span><span>{priced.deliveryCharge ? inr(priced.deliveryCharge) : 'Free'}</span></div>
      {priced.tax > 0 && <div className="sum-line"><span>Tax</span><span>{inr(priced.tax)}</span></div>}
      <div className="sum-line total"><span>Total</span><span>{inr(priced.total)}</span></div>
    </div>
  );
}

export default function CartPage() {
  const { items, priced, pricing, setQty, remove, setOpen } = useCart();
  const nav = useNavigate();
  return (
    <div className="container page">
      <Seo title="Shopping Cart" description="Review the items in your cart." />
      <h1>Shopping Cart</h1>
      {!items.length ? <Empty title="Your cart is empty" action={<Link className="btn btn-yellow" to="/products">Start shopping</Link>}>Add something crunchy and it will show up here.</Empty>
        : !priced ? <Skeleton h={200} /> : (
          <div className="two-col">
            <div className="card">{priced.lines.map((l) => (
              <div className="mini-item" key={`${l.productId}${l.variantId}`}>
                <img src={img(l.image, 160)} alt={l.name} /><div style={{ flex: 1 }}><Link to={`/products/${l.slug}`}><b>{l.name}</b></Link><div className="muted">{l.weight} · {inr(l.unitPrice)}</div></div>
                <div className="qty-mini"><button onClick={() => setQty(l.productId, l.variantId, l.quantity - 1)} disabled={l.quantity <= 1} aria-label="Decrease">-</button><span>{l.quantity}</span><button onClick={() => setQty(l.productId, l.variantId, l.quantity + 1)} disabled={l.quantity >= l.stock} aria-label="Increase">+</button></div>
                <b style={{ width: 90, textAlign: 'right' }}>{inr(l.lineTotal)}</b>
                <button className="trash" onClick={() => remove(l.productId, l.variantId)} aria-label={`Remove ${l.name}`}><Trash2 size={15} /></button>
              </div>))}
              <button className="link-btn mt" onClick={() => setOpen(true)}>Apply a coupon</button>
            </div>
            <div className="card"><h3 style={{ marginBottom: 10 }}>Order summary</h3><Summary priced={priced} />
              <button className="btn btn-yellow btn-block mt" disabled={pricing} onClick={() => nav('/checkout')}>Proceed to checkout</button></div>
          </div>)}
    </div>
  );
}
