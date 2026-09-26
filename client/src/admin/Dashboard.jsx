import { useState } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../services/api.js';
import { useFetch } from '../utils/hooks.js';
import { inr, dateTime } from '../utils/format.js';
import { ErrorState, Skeleton, Seo } from '../components/Common.jsx';
import { PageHead } from './ui.jsx';
import { StatusPill } from '../pages/Account.jsx';

function Bars({ data, k, money }) {
  const W = 600; const H = 190; const pad = 26;
  const max = Math.max(1, ...data.map((d) => d[k]));
  const bw = Math.max(2, (W - pad * 2) / data.length - 2);
  const step = Math.ceil(data.length / 8);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`${k} per day`}>
      {[0, 0.5, 1].map((t) => <g key={t}><line x1={pad} x2={W} y1={H - 22 - t * (H - 40)} y2={H - 22 - t * (H - 40)} stroke="#eee" /><text x="0" y={H - 19 - t * (H - 40)}>{money ? Math.round(max * t) : Math.round(max * t)}</text></g>)}
      {data.map((d, i) => { const h = (d[k] / max) * (H - 40); return <g key={d.date}><rect x={pad + i * ((W - pad * 2) / data.length)} y={H - 22 - h} width={bw} height={Math.max(h, d[k] ? 2 : 0)} fill={k === 'revenue' ? '#8c3d20' : '#d4a017'} rx="2"><title>{`${d.date}: ${money ? inr(d[k]) : d[k]}`}</title></rect>{i % step === 0 && <text x={pad + i * ((W - pad * 2) / data.length)} y={H - 6}>{d.date.slice(5)}</text>}</g>; })}
    </svg>
  );
}

export default function Dashboard() {
  const [range, setRange] = useState('30d');
  const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const custom = range === 'custom' && from && to;
  const { data, loading, error, reload } = useFetch(() => get('/admin/dashboard', custom ? { from, to } : { range: range === 'custom' ? '30d' : range }).then((r) => r.data), [range, from, to]);
  return (
    <div><Seo title="Admin dashboard" description="Admin" />
      <PageHead title="Dashboard">
        {[['7d', '7 days'], ['30d', '30 days'], ['90d', '90 days'], ['1y', '1 year'], ['custom', 'Custom']].map(([v, l]) => <button key={v} className={`chip ${range === v ? 'on' : ''}`} onClick={() => setRange(v)}>{l}</button>)}
        {range === 'custom' && <><input type="date" className="input" style={{ width: 150 }} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" /><input type="date" className="input" style={{ width: 150 }} value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" /></>}
      </PageHead>
      {error ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <Skeleton h={400} /> : (
        <div style={{ opacity: loading ? 0.6 : 1 }}>
          <div className="stat-grid">{[['Revenue', inr(data.revenue)], ['Orders', data.orders], ['Customers', data.customers], ['Products', data.products], ['Pending', data.status.pending], ['Processing', data.status.processing], ['Delivered', data.status.delivered], ['Cancelled', data.status.cancelled]].map(([l, v]) => <div className="stat" key={l}><small>{l}</small><b>{v}</b></div>)}</div>
          <div className="adm-grid-2"><div className="adm-card"><b>Revenue</b><Bars data={data.series} k="revenue" money /></div><div className="adm-card"><b>Orders</b><Bars data={data.series} k="orders" /></div></div>
          <div className="adm-grid-3">
            <div className="adm-card tbl-wrap"><b>Recent orders</b><table className="tbl"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead><tbody>
              {data.recentOrders.length ? data.recentOrders.map((o) => <tr key={o._id}><td><Link className="link-btn" to={`/admin/orders/${o._id}`}>{o.orderNumber}</Link></td><td>{o.customer?.name}</td><td>{inr(o.grandTotal)}</td><td><StatusPill s={o.orderStatus} /></td><td>{dateTime(o.createdAt)}</td></tr>) : <tr><td colSpan={5} className="muted">No orders yet</td></tr>}</tbody></table></div>
            <div className="form-stack">
              <div className="adm-card"><b>Top selling products</b>{data.topProducts.length ? data.topProducts.map((t) => <div className="sum-line" key={t._id}><span>{t.name}</span><span>{t.qty} sold</span></div>) : <p className="muted">No sales in this period.</p>}</div>
              <div className="adm-card"><b>Low stock</b>{data.lowStock.length ? data.lowStock.map((t) => <div className="sum-line" key={t._id}><Link to={`/admin/products/${t._id}/edit`}>{t.name}</Link><span style={{ color: t.totalStock === 0 ? '#b3261e' : undefined }}>{t.totalStock} left</span></div>) : <p className="muted">All products are well stocked.</p>}</div>
            </div>
          </div>
        </div>)}
    </div>
  );
}
