import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../context/cart.jsx';
import { img, inr, cheapestInStock } from '../utils/format.js';

function Media({ p, priority }) {
  const { wishIds, toggleWish } = useCart();
  const on = wishIds.includes(String(p._id));
  const first = p.variants?.[0];
  return (
    <div className="pcard-media">
      {(p.badge || p.discountPercent > 0) && <span className={`pbadge ${p.badge ? 'dark' : ''}`}>{p.badge || `Save ${p.discountPercent}%`}</span>}
      <button className={`pheart ${on ? 'on' : ''}`} onClick={() => toggleWish(p._id)} aria-label={on ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={on}>
        <Heart size={15} className={on ? 'heart-fill' : ''} />
      </button>
      <Link to={`/products/${p.slug}`} aria-label={p.name}>
        <img src={img(p.images?.[0]?.url, 480)} alt={p.name} loading={priority ? 'eager' : 'lazy'} width="480" height="480" />
      </Link>
      <div className="pmeta"><span className="star">★</span>{p.ratingCount ? p.ratingAvg.toFixed(1) : 'New'}<span>{first?.weight}</span></div>
    </div>
  );
}

export function ProductCard({ p, priority }) {
  const { add } = useCart();
  const v = cheapestInStock(p);
  return (
    <article className="pcard">
      <Media p={p} priority={priority} />
      <Link to={`/products/${p.slug}`} className="pname">{p.name}</Link>
      <div className="pprice"><span>{inr(v ? v.price : p.price)}</span>{p.mrp > (v ? v.price : p.price) && <s>{inr(p.mrp)}</s>}</div>
      <button className="pbtn" disabled={!v} onClick={() => add(p._id, v._id)}>{v ? 'Add to cart +' : 'Sold out'}</button>
    </article>
  );
}

export function ExoCard({ p }) {
  const { add } = useCart();
  const v = cheapestInStock(p);
  return (
    <article className="exo">
      <div className="pcard-media">
        {p.badge && <span className="pbadge dark">{p.badge}</span>}
        {!v && <span className="pbadge" style={{ background: '#111', color: '#fff', left: 'auto', right: 0, borderRadius: '0 0 0 6px' }}>Sold out</span>}
        <Link to={`/products/${p.slug}`}><img src={img(p.images?.[0]?.url, 420)} alt={p.name} loading="lazy" width="420" height="420" /></Link>
      </div>
      <small>MS dry fruit</small>
      <Link to={`/products/${p.slug}`} className="name">{p.name}</Link>
      <div className="mrp">{p.mrp > p.price && <s style={{ color: '#777', marginRight: 6 }}>{inr(p.mrp)}</s>}{inr(p.price)}</div>
      <button className={`btn btn-sm ${v ? 'btn-outline' : ''}`} style={!v ? { background: '#eee' } : undefined} disabled={!v} onClick={() => add(p._id, v._id)}>{v ? 'Add to cart' : 'Notify me'}</button>
    </article>
  );
}

export function Scroller({ children, label }) {
  const ref = useRef(null);
  const by = (d) => ref.current?.scrollBy({ left: d * (ref.current.clientWidth * 0.8), behavior: 'smooth' });
  return (
    <div className="scroller">
      <div className="scroller-track" ref={ref} role="list" aria-label={label}>{children}</div>
      <div className="scroller-btns">
        <button className="round-btn" onClick={() => by(-1)} aria-label="Scroll left"><ChevronLeft size={16} /></button>
        <button className="round-btn" onClick={() => by(1)} aria-label="Scroll right"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}
