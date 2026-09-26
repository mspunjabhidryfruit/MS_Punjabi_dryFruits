import { Link, useParams } from 'react-router-dom';
import { Check, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { get, download } from '../services/api.js';
import { useFetch } from '../utils/hooks.js';
import { img, inr, date } from '../utils/format.js';
import { Seo, ErrorState, Skeleton } from '../components/Common.jsx';

export const addr = (a) => `${a.name}, ${a.line1}${a.line2 ? `, ${a.line2}` : ''}, ${a.city}, ${a.state} - ${a.pincode}. Phone: ${a.phone}`;

export default function OrderConfirmation() {
  const { orderNumber } = useParams();
  const { data, loading, error, reload } = useFetch(() => get(`/orders/${orderNumber}`).then((r) => r.data.order), [orderNumber]);
  if (error) return <div className="container page"><ErrorState message={error} onRetry={reload} /></div>;
  if (loading || !data) return <div className="container page"><Skeleton h={400} /></div>;
  const o = data;
  return (
    <div className="container page" style={{ maxWidth: 900 }}>
      <Seo title="Order Confirmed" description="Your order has been placed." />
      <div className="confirm-hero">
        <div className="check-ring"><Check size={44} strokeWidth={3} /></div>
        <h1 style={{ fontSize: 44, marginBottom: 6 }}>Order Confirmed</h1>
        <p style={{ margin: '0 auto', maxWidth: 480 }}>Thank you, {o.customer.name.split(' ')[0]}! We are packing your dry fruits with care. A confirmation email is on its way to <b>{o.customer.email}</b>.</p>
        <div className="flex gap wrap" style={{ justifyContent: 'center', marginTop: 24 }}>
          {[['Order number', o.orderNumber], ['Order date', date(o.createdAt)], ['Payment', o.paymentMethod === 'COD' ? 'Cash on Delivery' : `Online (${o.paymentStatus})`], ['Total', inr(o.grandTotal)]].map(([k, v]) => <div key={k} style={{ background: '#fff', border: '1px solid var(--line-2)', borderRadius: 10, padding: '10px 18px', textAlign: 'left' }}><div className="muted" style={{ fontSize: 11 }}>{k}</div><b>{v}</b></div>)}
        </div>
      </div>
      <div className="two-col mt">
        <div className="card"><h3 style={{ marginBottom: 8 }}>Your items</h3>
          {o.items.map((i) => <div className="mini-item" key={i.variantId}><img src={img(i.image, 120)} alt="" /><div style={{ flex: 1 }}><b>{i.name}</b><div className="muted" style={{ fontSize: 11 }}>{i.weight} × {i.quantity} · {inr(i.unitPrice)} each</div></div><b>{inr(i.lineTotal)}</b></div>)}
          <div className="mt">
            <div className="sum-line"><span>Subtotal</span><span>{inr(o.subtotal)}</span></div>
            {o.discount > 0 && <div className="sum-line"><span>Coupon ({o.coupon?.code})</span><span>- {inr(o.discount)}</span></div>}
            <div className="sum-line"><span>Delivery</span><span>{o.deliveryCharge ? inr(o.deliveryCharge) : 'Free'}</span></div>
            {o.tax > 0 && <div className="sum-line"><span>Tax</span><span>{inr(o.tax)}</span></div>}
            <div className="sum-line total"><span>Total</span><span>{inr(o.grandTotal)}</span></div>
          </div>
        </div>
        <div className="card"><h3 style={{ marginBottom: 8 }}>Delivery</h3>
          <p style={{ margin: '0 0 12px', fontSize: 13 }}>{addr(o.shippingAddress)}</p>
          <div style={{ background: 'var(--cream)', padding: 12, borderRadius: 8, fontSize: 13 }}>Estimated delivery<br /><b>{date(o.estimatedDelivery)}</b></div>
          <div className="form-stack mt">
            <Link to={`/account/orders/${o.orderNumber}`} className="btn btn-yellow">Track order</Link>
            <button className="btn btn-outline" onClick={() => download(`/orders/${o.orderNumber}/invoice`, `MS-Punjabi-Dry-Fruits-${o.orderNumber}.pdf`).catch((e) => toast.error(e.message))}><Download size={16} />Download invoice</button>
            <Link to="/products" className="btn btn-outline">Continue shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
