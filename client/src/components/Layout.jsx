import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Search,
  User,
  ShoppingCart,
  Heart,
  Menu,
  X,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Trash2,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSite } from "../context/site.jsx";
import { useAuth } from "../context/auth.jsx";
import { useCart } from "../context/cart.jsx";
import { get, post } from "../services/api.js";
import { img, inr } from "../utils/format.js";
import { useConfirm } from "./Common.jsx";

function Announcement() {
  const { settings } = useSite();
  const list = settings.announcements?.length
    ? settings.announcements
    : ["Free Delivery on orders above Rs. 300"];
  const loop = [...list, ...list, ...list, ...list];
  return (
    <div className="ticker" role="marquee" aria-label="Offers">
      <div className="ticker-track">
        {[0, 1].map((k) => (
          <div key={k} style={{ display: "inline-flex" }}>
            {loop.map((t, i) => (
              <span key={`${k}-${i}`}>{t}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Header() {
  const { settings } = useSite();
  const { user, logout, isAdmin } = useAuth();
  const { count, setOpen, wishIds } = useCart();
  const nav = useNavigate();
  const loc = useLocation();
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState(false);
  const [acct, setAcct] = useState(false);
  const acctRef = useRef(null);

  useEffect(() => {
    setMenu(false);
    setAcct(false);
  }, [loc.pathname, loc.search]);
  useEffect(() => {
    const h = (e) => {
      if (acctRef.current && !acctRef.current.contains(e.target))
        setAcct(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="header">
      <Announcement />
      <div className="container">
        <div className="header-main">
          <button
            className="icon-btn menu-btn"
            onClick={() => setMenu(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <Link
            to="/"
            className="header-logo"
            aria-label="MS Punjabi Dry Fruits home"
          >
            <img
              src={settings.logo || "/img/logo.jpg"}
              alt="MS Punjabi Dry Fruits"
              width="76"
              height="76"
            />
          </Link>
          <form className="search" onSubmit={submit} role="search">
            <Search size={15} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              aria-label="Search products"
              maxLength={60}
            />
          </form>
          <div className="header-icons">
            <div style={{ position: "relative" }} ref={acctRef}>
              <button
                className="icon-btn"
                aria-label="Account"
                aria-expanded={acct}
                onClick={() => (user ? setAcct(!acct) : nav("/login"))}
              >
                <User size={18} />
              </button>
              {acct && user && (
                <div className="acct-menu">
                  <div
                    style={{
                      padding: "8px 12px",
                      fontSize: 12,
                      color: "var(--muted)",
                    }}
                  >
                    Hi, {user.name.split(" ")[0]}
                  </div>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      style={{ fontWeight: 700, color: "var(--brown)" }}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <Link to="/account">My Account</Link>
                  <Link to="/account/orders">My Orders</Link>
                  <Link to="/account/wishlist">Wishlist</Link>
                  <button
                    onClick={() => {
                      logout();
                      toast.success("Signed out");
                      nav("/");
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
            <button
              className="icon-btn"
              onClick={() => setOpen(true)}
              aria-label={`Cart, ${count} items`}
            >
              <ShoppingCart size={18} />
              {count > 0 && <span className="badge-dot">{count}</span>}
            </button>
            <Link
              to="/account/wishlist"
              className="icon-btn"
              aria-label={`Wishlist, ${wishIds.length} items`}
            >
              <Heart size={18} className="heart-fill" />
            </Link>
          </div>
        </div>
        <nav className="nav" aria-label="Main">
          {settings.navLinks.map((l) => (
            <NavLink
              key={l.label}
              to={l.to}
              className={({ isActive }) => {
                if (l.label === "News") {
                  return loc.pathname === "/blog" &&
                    new URLSearchParams(loc.search).get("type") === "news"
                    ? "active"
                    : "";
                }

                if (l.label === "Blog") {
                  return loc.pathname === "/blog" &&
                    new URLSearchParams(loc.search).get("type") !== "news"
                    ? "active"
                    : "";
                }

                return isActive ? "active" : "";
              }}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
      {menu && (
        <div className="mobile-nav" onClick={() => setMenu(false)}>
          <nav onClick={(e) => e.stopPropagation()} aria-label="Mobile">
            <button
              className="icon-btn"
              style={{ alignSelf: "flex-end" }}
              onClick={() => setMenu(false)}
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
            {settings.navLinks.map((l) => (
              <Link key={l.label} to={l.to}>
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    style={{ color: "var(--brown)", fontWeight: 700 }}
                  >
                    Admin Panel
                  </Link>
                )}
                <Link to="/account">My Account</Link>
                <Link to="/account/orders">My Orders</Link>
              </>
            ) : (
              <>
                <Link to="/login">Sign in</Link>
                <Link to="/register">Create account</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export function NewsletterBand() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await post("/newsletter", { email });
      toast.success(r.data.message);
      setEmail("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="newsletter" aria-label="Newsletter">
      <div className="container inner">
        <div>
          <div className="eyebrow">join our newsletter</div>

          <h2 className="big-serif newsletter-title">
            <span>Subscribe to our</span> <b>Email alerts</b>
          </h2>
        </div>
        <form className="nl-form" onSubmit={submit}>
          <label className="sr-only" htmlFor="nl-email">
            Email
          </label>
          <input
            id="nl-email"
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" disabled={busy}>
            {busy ? "..." : "Subscribe"}
          </button>
        </form>
      </div>
    </section>
  );
}

function Footer() {
  const { settings } = useSite();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">
              <img
                src={settings.logo}
                alt="MS Punjabi Dry Fruits"
                width="84"
                height="84"
                loading="lazy"
              />
            </div>
            <p className="about">
              Shop premium dry fruits, exotic nuts &amp; healthy snacks at MS
              dry fruit. Almonds, cashews, walnuts, macadamia, pecan, edamame
              &amp; more. 100% natural, FSSAI certified. Free delivery across
              India.
            </p>
            <div className="socials">
              <a href={settings.social?.facebook || "#"} aria-label="Facebook">
                <Facebook size={15} />
              </a>
              <a
                href={settings.social?.instagram || "#"}
                aria-label="Instagram"
              >
                <Instagram size={15} />
              </a>
              <a
                href={settings.email ? `mailto:${settings.email}` : "/contact"}
                aria-label="Email"
              >
                <Mail size={15} />
              </a>
            </div>
          </div>
          <div>
            <h4>My Account</h4>
            <ul>
              <li>
                <Link to="/account">My Account</Link>
              </li>
              <li>
                <Link to="/account/orders">Order History</Link>
              </li>
              <li>
                <Link to="/cart">Shopping Cart</Link>
              </li>
              <li>
                <Link to="/account/orders">Track Order</Link>
              </li>
              <li>
                <Link to="/policy/shipping">Shipping Policy</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Helps</h4>
            <ul>
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
              <li>
                <Link to="/policy/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/policy/terms">Terms &amp; Conditions</Link>
              </li>
              <li>
                <Link to="/policy/refund">Return, Refund Policy</Link>
              </li>
              <li>
                <Link to="/policy/manufacturing">Manufacturing Units</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Shops</h4>
            <ul>
              {[
                ["Nuts", "nuts"],
                ["Berries", "dried-berries"],
                ["Roasted Nuts", "roasted-nuts"],
                ["Cashew", "cashews"],
                ["Almond", "almond"],
                ["Pistachios", "pistachios"],
              ].map(([l, s]) => (
                <li key={s}>
                  <Link to={`/category/${s}`}>{l}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Contact Us</h4>
            <ul className="contact-list">
              <li>
                <Mail size={14} />
                {settings.email ? (
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                ) : (
                  <span className="sr-only">Email</span>
                )}
              </li>
              <li>
                <Phone size={14} />
                {settings.phone ? (
                  <a href={`tel:${settings.phone.replace(/\s/g, "")}`}>
                    {settings.phone}
                  </a>
                ) : (
                  <span className="sr-only">Phone</span>
                )}
              </li>
              <li>
                <MapPin size={14} />
                {settings.address && <span>{settings.address}</span>}
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()}, {settings.storeName}{" "}
            <span className="links">
              <Link to="/policy/privacy">Privacy policy</Link>
              <Link to="/policy/refund">Refund policy</Link>
              <Link to="/policy/shipping">Shipping policy</Link>
              <Link to="/policy/terms">Terms of service</Link>
              <Link to="/contact">Contact information</Link>
            </span>
          </div>
          <div className="pay" aria-label="Accepted payments">
            <span>UPI</span>
            <span>VISA</span>
            <span>Mastercard</span>
            <span>RuPay</span>
            <span>COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function CartDrawer() {
  const {
    open,
    setOpen,
    priced,
    pricing,
    items,
    setQty,
    remove,
    coupon,
    couponError,
    applyCoupon,
    removeCoupon,
    add,
  } = useCart();
  const nav = useNavigate();
  const confirm = useConfirm();
  const [showList, setShowList] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("");
  const [coupons, setCoupons] = useState([]);
  const [recs, setRecs] = useState([]);
  const [showTotals, setShowTotals] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    get("/coupons")
      .then((r) => setCoupons(r.data.items))
      .catch(() => {});
    get("/products", { bestSeller: "true", limit: 6 })
      .then((r) => setRecs(r.data.items))
      .catch(() => {});
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);
  if (!open) return null;

  const lines = priced?.lines || [];
  const inCart = new Set(items.map((i) => i.productId));
  const suggestions = recs
    .filter((p) => !inCart.has(String(p._id)) && p.totalStock > 0)
    .slice(0, 2);
  const go = () => {
    setOpen(false);
    nav("/checkout");
  };
  const doApply = async (c) => {
    if (await applyCoupon(c)) {
      setCode("");
      setShowCode(false);
      setShowList(false);
    }
  };

  return (
    <>
      <div className="overlay" onClick={() => setOpen(false)} />
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
      >
        <div className="drawer-head">
          <span>Your cart ({items.reduce((s, i) => s + i.quantity, 0)})</span>
          <button
            ref={closeRef}
            className="icon-btn"
            onClick={() => setOpen(false)}
            aria-label="Close cart"
          >
            <X size={22} />
          </button>
        </div>
        <div className="drawer-banner">Welcome To MS Dry Fruit</div>
        <div className="drawer-body">
          {!items.length && (
            <div className="empty">
              <h3>Your cart is empty</h3>
              <p>Add something crunchy and it will show up here.</p>
              <Link
                className="btn btn-yellow"
                to="/products"
                onClick={() => setOpen(false)}
              >
                Start shopping
              </Link>
            </div>
          )}
          {priced && priced.amountToFreeDelivery > 0 && lines.length > 0 && (
            <div className="free-ship">
              Add <b>{inr(priced.amountToFreeDelivery)}</b> more for free
              delivery
              <div className="bar">
                <i
                  style={{
                    width: `${Math.min(100, (priced.subtotal / priced.freeDeliveryThreshold) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
          {lines.map((l) => (
            <div className="cart-line" key={`${l.productId}-${l.variantId}`}>
              <Link to={`/products/${l.slug}`} onClick={() => setOpen(false)}>
                <img src={img(l.image, 240)} alt={l.name} />
              </Link>
              <div className="info">
                <div className="row">
                  <div>
                    <div className="n">{l.name}</div>
                    <div className="w">{l.weight}</div>
                  </div>
                  <div className="p">
                    {inr(l.lineTotal)}
                    {l.originalPrice > l.unitPrice && (
                      <s>{inr(l.originalPrice * l.quantity)}</s>
                    )}
                  </div>
                </div>
                <div className="ctrl">
                  <button
                    className="trash"
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Remove cart item",
                        message: `Remove "${l.name}" from your cart?`,
                        confirmText: "Remove",
                      });
                      if (!ok) return;
                      remove(l.productId, l.variantId);
                    }}
                    aria-label={`Remove ${l.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="qty-mini">
                    <button
                      onClick={() =>
                        setQty(l.productId, l.variantId, l.quantity - 1)
                      }
                      disabled={l.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span aria-live="polite">{l.quantity}</span>
                    <button
                      onClick={() =>
                        setQty(l.productId, l.variantId, l.quantity + 1)
                      }
                      disabled={l.quantity >= l.stock}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {items.length > 0 && !lines.length && pricing && (
            <div className="skeleton" style={{ height: 130 }} />
          )}
          {items.length > 0 && (
            <div className="coupon-box">
              <button className="r1" onClick={() => setShowList(!showList)}>
                <span className="disc-ico">%</span>
                <span className="grow">
                  {coupon ? `Coupon ${coupon} applied` : "View Coupons"}
                </span>
                <ChevronRight size={18} />
              </button>
              {showList && (
                <div className="coupon-list">
                  {coupons.length ? (
                    coupons.map((c) => (
                      <button key={c.code} onClick={() => doApply(c.code)}>
                        <b>{c.code}</b> -{" "}
                        {c.description ||
                          (c.type === "percent"
                            ? `${c.value}% off`
                            : `Rs. ${c.value} off`)}
                      </button>
                    ))
                  ) : (
                    <span style={{ fontSize: 12 }}>
                      No coupons available right now.
                    </span>
                  )}
                </div>
              )}
              <button
                className="r2"
                onClick={() =>
                  coupon ? removeCoupon() : setShowCode(!showCode)
                }
              >
                <span
                  className="disc-ico"
                  style={{ width: 22, height: 22, fontSize: 11 }}
                >
                  %
                </span>
                <span className="grow">
                  {coupon ? "Remove coupon" : "More Offers"}
                </span>
                {!coupon && <span className="hint">Enter a Coupon Code</span>}
                <ChevronRight size={16} />
              </button>
              {showCode && !coupon && (
                <form
                  className="coupon-apply"
                  onSubmit={(e) => {
                    e.preventDefault();
                    doApply(code);
                  }}
                >
                  <input
                    className="input"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    aria-label="Coupon code"
                    maxLength={30}
                  />
                  <button className="btn btn-yellow btn-sm" type="submit">
                    Apply
                  </button>
                </form>
              )}
              {couponError && (
                <div
                  className="field-error"
                  style={{ padding: "6px 16px 10px" }}
                >
                  {couponError}
                </div>
              )}
            </div>
          )}
          {items.length > 0 && suggestions.length > 0 && (
            <div className="mightlike">
              <h5>You might also like</h5>
              <div className="ml-grid">
                {suggestions.map((p) => {
                  const v = p.variants.find((x) => x.stock > 0);
                  return (
                    <div className="ml-item" key={p._id}>
                      <Link
                        to={`/products/${p.slug}`}
                        onClick={() => setOpen(false)}
                      >
                        <img
                          src={img(p.images?.[0]?.url, 200)}
                          alt={p.name}
                          loading="lazy"
                        />
                      </Link>
                      <div className="t">
                        {p.name}
                        <b>{inr(v.price)}</b>
                      </div>
                      <button
                        onClick={() =>
                          add(p._id, v._id, 1, { openDrawer: false })
                        }
                      >
                        Add
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div className="drawer-foot">
            <div className="box">
              {showTotals && priced && (
                <div style={{ fontSize: 13, marginBottom: 10 }}>
                  <div className="sum-line">
                    <span>Subtotal</span>
                    <span>{inr(priced.subtotal)}</span>
                  </div>
                  {priced.discount > 0 && (
                    <div className="sum-line">
                      <span>Coupon</span>
                      <span>- {inr(priced.discount)}</span>
                    </div>
                  )}
                  <div className="sum-line">
                    <span>Delivery</span>
                    <span>
                      {priced.deliveryCharge
                        ? inr(priced.deliveryCharge)
                        : "Free"}
                    </span>
                  </div>
                  {priced.tax > 0 && (
                    <div className="sum-line">
                      <span>Tax</span>
                      <span>{inr(priced.tax)}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="tot">
                <span>Estimated total</span>
                <span>
                  {priced && priced.mrpTotal > priced.total && (
                    <s>{inr(priced.mrpTotal)}</s>
                  )}
                  <b>{priced ? inr(priced.total) : "..."}</b>
                  <button
                    className="icon-btn"
                    style={{ padding: 0, marginLeft: 4 }}
                    onClick={() => setShowTotals(!showTotals)}
                    aria-label="Toggle price breakdown"
                  >
                    {showTotals ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronUp size={16} />
                    )}
                  </button>
                </span>
              </div>
              <button
                className="checkout-btn"
                onClick={go}
                disabled={!lines.length || pricing}
              >
                Checkout
                <span style={{ fontSize: 11, fontWeight: 600 }}>
                  UPI · Cards · COD
                </span>
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function PromoModal() {
  const { settings } = useSite();
  const loc = useLocation();
  const nav = useNavigate();
  const [show, setShow] = useState(false);
  const p = settings.popup;
  useEffect(() => {
    if (
      !p?.enabled ||
      !p.offers?.length ||
      sessionStorage.getItem("msp_promo") ||
      loc.pathname !== "/"
    )
      return undefined;
    const t = setTimeout(() => setShow(true), (p.delaySeconds ?? 4) * 1000);
    return () => clearTimeout(t);
  }, [p, loc.pathname]);
  useEffect(() => {
    if (!show) return undefined;
    const esc = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);
  const close = () => {
    sessionStorage.setItem("msp_promo", "1");
    setShow(false);
  };
  if (!show) return null;
  const go = (url) => {
    close();
    nav(url || p.ctaUrl || "/products");
  };
  return (
    <div className="modal-wrap" onClick={close}>
      <div
        className="promo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="promo-x"
          onClick={close}
          aria-label="Close offers"
          autoFocus
        >
          <X size={20} />
        </button>
        <div className="promo-head">
          <h2 id="promo-title">🎉 {p.title}</h2>
          <p>{p.subtitle}</p>
        </div>
        <div className="promo-body">
          {p.offers.map((o, i) => (
            <button
              key={i}
              className="offer"
              style={{ border: 0, textAlign: "left", width: "100%" }}
              onClick={() => go(o.url)}
            >
              {o.image && <img src={img(o.image, 300)} alt="" />}
              <div>
                <h4>{o.title}</h4>
                <b>{o.subtitle}</b>
                <span>{o.note}</span>
              </div>
            </button>
          ))}
          <button className="btn btn-orange" onClick={() => go()}>
            {p.ctaText || "Shop Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const loc = useLocation();
  useEffect(() => {
    if (!loc.hash) window.scrollTo(0, 0);
  }, [loc.pathname, loc.hash]);
  return (
    <>
      <a href="#main" className="sr-only">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <NewsletterBand />
      <Footer />
      <CartDrawer />
      <PromoModal />
    </>
  );
}
