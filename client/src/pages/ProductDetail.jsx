import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Heart, ShieldCheck, Truck, BadgeCheck } from "lucide-react";
import toast from "react-hot-toast";
import { get, post } from "../services/api.js";
import { useFetch } from "../utils/hooks.js";
import { useCart } from "../context/cart.jsx";
import { useAuth } from "../context/auth.jsx";
import { img, inr, date } from "../utils/format.js";
import { ProductCard, Scroller } from "../components/ProductCard.jsx";
import {
  Seo,
  Crumbs,
  Skeleton,
  ErrorState,
  Stars,
  Field,
} from "../components/Common.jsx";

function Reviews({ product, reviews }) {
  const { user } = useAuth();
  const [can, setCan] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (user)
      get(`/reviews/can/${product._id}`)
        .then((r) => setCan(r.data))
        .catch(() => {});
    else setCan(null);
  }, [user, product._id]);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await post("/reviews", {
        productId: product._id,
        rating,
        comment,
      });
      toast.success(r.data.message);
      setCan({ canReview: false, existing: "pending" });
      setComment("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      {reviews.length === 0 && <p className="muted">No reviews yet.</p>}
      {reviews.map((r) => (
        <div className="rev" key={r._id}>
          <Stars n={r.rating} /> <b style={{ marginLeft: 6 }}>{r.name}</b>{" "}
          {r.verified && (
            <span className="status approved" style={{ marginLeft: 6 }}>
              Verified purchase
            </span>
          )}
          <div className="muted" style={{ fontSize: 11 }}>
            {date(r.createdAt)}
          </div>
          <p style={{ margin: "6px 0 0" }}>{r.comment}</p>
        </div>
      ))}
      <div className="card mt">
        {!user ? (
          <p style={{ margin: 0 }}>
            <Link
              className="link-btn"
              to={`/login?next=${encodeURIComponent(window.location.pathname)}`}
            >
              Sign in
            </Link>{" "}
            to review products you have purchased.
          </p>
        ) : can?.existing ? (
          <p style={{ margin: 0 }}>
            Your review is{" "}
            {can.existing === "approved" ? "published" : "awaiting approval"}.
            Thank you!
          </p>
        ) : can && !can.purchased ? (
          <p style={{ margin: 0 }}>
            Only customers who purchased this product can leave a review.
          </p>
        ) : can?.canReview ? (
          <form className="form-stack" onSubmit={submit}>
            <b>Write a review</b>
            <div className="star-input" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  className={n <= rating ? "on" : ""}
                  onClick={() => setRating(n)}
                  aria-label={`${n} stars`}
                >
                  ★
                </button>
              ))}
            </div>
            <Field label="Your review" id="rv">
              <textarea
                id="rv"
                className="textarea"
                required
                minLength={5}
                maxLength={1200}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </Field>
            <button className="btn btn-yellow" disabled={busy}>
              {busy ? "Submitting..." : "Submit review"}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { add, wishIds, toggleWish } = useCart();
  const { data, loading, error, reload } = useFetch(
    () => get(`/products/${slug}`).then((r) => r.data),
    [slug],
  );
  const [vid, setVid] = useState("");
  const [qty, setQty] = useState(1);
  const [idx, setIdx] = useState(0);
  const [more, setMore] = useState(false);
  const [tab, setTab] = useState(
    window.location.hash === "#reviews" ? "reviews" : "info",
  );
  const [pin, setPin] = useState("");
  const [eta, setEta] = useState(null);

  useEffect(() => {
    if (!data) return;
    const first =
      data.product.variants.find((v) => v.stock > 0) ||
      data.product.variants[0];
    setVid(first._id);
    setQty(1);
    setIdx(0);
    setMore(false);
    setEta(null);
  }, [data]);

  if (error)
    return (
      <div className="container">
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  if (loading || !data)
    return (
      <div className="container section">
        <div className="pd">
          <Skeleton h={60} />
          <Skeleton h={480} />
          <Skeleton h={380} />
        </div>
      </div>
    );
  const { product: p, reviews, related } = data;
  const v = p.variants.find((x) => x._id === vid) || p.variants[0];
  const mrp = v.mrp > v.price ? v.mrp : 0;
  const off = mrp ? Math.round(((mrp - v.price) / mrp) * 100) : 0;
  const inStock = v.stock > 0;
  const wished = wishIds.includes(String(p._id));
  const desc = p.description || "";
  const check = async () => {
    try {
      const r = await get(`/pincode/${pin}`);
      setEta(r.data);
    } catch (e) {
      setEta(null);
      toast.error(e.message);
    }
  };
  const buyNow = () => {
    add(p._id, v._id, qty, { openDrawer: false });
    nav("/checkout");
  };
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    image: p.images.map((i) => i.url),
    description: p.shortDescription,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: v.price,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(p.ratingCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: p.ratingAvg,
            reviewCount: p.ratingCount,
          },
        }
      : {}),
  };

  return (
    <>
      <Seo
        title={p.seoTitle || p.name}
        description={
          p.seoDescription || p.shortDescription || desc.slice(0, 150)
        }
        image={p.images[0]?.url}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <div className="container">
        <Crumbs
          items={[
            { label: p.category.name, to: `/category/${p.category.slug}` },
            { label: p.name },
          ]}
        />
        <div className="pd">
          <div className="pd-gallery">
            <div className="pd-main">
              {off > 0 && <span className="pbadge">Save {off}%</span>}

              <img
                src={img(p.images[idx]?.url, 900)}
                alt={`${p.name} pack`}
                fetchpriority="high"
                width="900"
                height="900"
              />
            </div>

            {/* PRODUCT THUMBNAILS */}
            <div className="pd-thumbs">
              {p.images.map((im, i) => (
                <button
                  key={i}
                  className={i === idx ? "on" : ""}
                  onClick={() => setIdx(i)}
                  aria-label={`Image ${i + 1}`}
                >
                  <img
                    src={img(im.url, 140)}
                    alt={`${p.name} image ${i + 1}`}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>

            {/* PRODUCT FEATURE ICONS */}
            <div className="pd-icons">
              {[
                ["042", "Nutrients Rich"],
                ["044", "Crunchy & Delicious"],
                ["046", "100% Natural"],
              ].map(([n, l]) => (
                <div key={n}>
                  <img
                    src={`/img/icon-${n}.jpg`}
                    alt=""
                    width="56"
                    height="56"
                    loading="lazy"
                  />
                  {l}
                </div>
              ))}
            </div>
          </div>
          <div className="pd-info">
            <h1>{p.name}</h1>
            <div style={{ fontSize: 12, margin: "6px 0 12px" }}>
              {p.shortDescription}
              {p.ratingCount > 0 && (
                <span className="rating-chip">
                  ★ {p.ratingAvg.toFixed(1)} ({p.ratingCount})
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.7, color: "#333" }}>
              {more || desc.length < 190 ? desc : `${desc.slice(0, 190)}...`}
            </div>
            {desc.length >= 190 && (
              <button className="readmore" onClick={() => setMore(!more)}>
                {more ? "Read Less" : "Read More"}
              </button>
            )}
            <div className="pd-price">
              {inr(v.price)}
              {mrp > 0 && <s>{inr(mrp)}</s>}
              {off > 0 && <em>{off}% OFF</em>}
            </div>
            {p.benefits?.length > 0 && (
              <ul
                style={{
                  fontSize: 12,
                  paddingLeft: 18,
                  color: "#333",
                  lineHeight: 1.7,
                }}
              >
                {p.benefits.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
            <div className="opt-label">Weight</div>
            <div>
              {p.variants.map((x) => (
                <button
                  key={x._id}
                  className={`opt ${x._id === vid ? "on" : ""}`}
                  disabled={x.stock < 1}
                  onClick={() => {
                    setVid(x._id);
                    setQty(1);
                  }}
                  aria-pressed={x._id === vid}
                >
                  {x.weight}
                </button>
              ))}
            </div>
            <div className="opt-label">Available In</div>
            <span className="opt on">{p.packLabel || "Pack of 1"}</span>
            <div className="opt-label">Quantity</div>
            <div className="flex gap" style={{ alignItems: "center" }}>
              <div className="qty">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  aria-label="Decrease"
                >
                  −
                </button>
                <span aria-live="polite">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(v.stock, qty + 1))}
                  aria-label="Increase"
                  disabled={qty >= v.stock}
                >
                  +
                </button>
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: inStock ? "#2e7d32" : "#b3261e",
                  fontWeight: 600,
                }}
              >
                {!inStock
                  ? "Out of stock"
                  : v.stock <= 10
                    ? `Only ${v.stock} left`
                    : "In stock"}
              </span>
            </div>
            <div className="pd-actions">
              <button
                className="btn btn-yellow"
                disabled={!inStock}
                onClick={() => add(p._id, v._id, qty)}
              >
                Add to cart
              </button>
              <button
                className="btn btn-outline"
                disabled={!inStock}
                onClick={buyNow}
              >
                Buy it now
              </button>
              <button
                className="btn btn-outline"
                style={{ flex: "0 0 46px", padding: 0 }}
                onClick={() => toggleWish(p._id)}
                aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={wished}
              >
                <Heart size={18} className={wished ? "heart-fill" : ""} />
              </button>
            </div>
            <div
              className="flex gap"
              style={{ marginTop: 16, alignItems: "flex-end" }}
            >
              <Field label="Check delivery" id="pin">
                <input
                  id="pin"
                  className="input"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter pincode"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                />
              </Field>
              <button
                className="btn btn-outline btn-sm"
                style={{ height: 40 }}
                onClick={check}
                disabled={pin.length !== 6}
              >
                Check
              </button>
            </div>
            {eta && (
              <div style={{ fontSize: 12, marginTop: 8, color: "#2e7d32" }}>
                Delivery in about {eta.days} days, by{" "}
                {date(eta.estimatedDelivery)}.
              </div>
            )}
            {p.highlights?.length > 0 && (
              <div className="muted" style={{ fontSize: 11, marginTop: 16 }}>
                {p.highlights.join("  ·  ")}
              </div>
            )}
            <div className="pd-badges">
              <div>
                <img src="/badges/fssai.png" alt="FSSAI Certified" />
              </div>

              <div>
                <img src="/badges/guarantee.png" alt="7-Day Guarantee" />
              </div>

              <div>
                <img src="/badges/secure-payment.png" alt="Secure Payments" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <section
        className="did-you-know"
        style={{
          background: "linear-gradient(90deg,#f6ead5,#f0d9b5)",
          padding: "36px 0",
        }}
      >
        <div className="container">
          <h2
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 800,
              fontSize: 40,
              color: "#7a1414",
              textTransform: "uppercase",
            }}
          >
            Did you know?
          </h2>
          <p
            style={{
              fontFamily: "var(--pop)",
              fontWeight: 600,
              fontSize: 22,
              maxWidth: 520,
              margin: "10px 0 0",
            }}
          >
            {p.category.name} are a great source of nutrition and natural
            energy.
          </p>
          <div className="flex gap wrap" style={{ marginTop: 18 }}>
            {(p.highlights?.length
              ? p.highlights
              : ["Nutrient rich", "Hygienically packed", "No preservatives"]
            ).map((h) => (
              <span
                key={h}
                style={{
                  background: "#fff",
                  padding: "10px 18px",
                  borderRadius: 30,
                  fontWeight: 600,
                  fontSize: 13,
                  boxShadow: "var(--shadow)",
                }}
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="container" aria-label="Product information">
        <div className="tabs" role="tablist">
          {[
            ["info", "Product information"],
            ["reviews", `Reviews (${reviews.length})`],
          ].map(([k, l]) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              className={tab === k ? "on" : ""}
              onClick={() => setTab(k)}
            >
              {l}
            </button>
          ))}
        </div>
        {tab === "info" ? (
          <div style={{ fontSize: 13, lineHeight: 1.9, maxWidth: 820 }}>
            <p>{desc}</p>
            {p.benefits?.length > 0 && (
              <ul>
                {p.benefits.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
            <p className="muted">
              Brand: {p.brand}. Store in a cool, dry place. Once opened, keep in
              an airtight container.
            </p>
          </div>
        ) : (
          <Reviews product={p} reviews={reviews} />
        )}
      </section>

      {related.length > 0 && (
        <section className="section container">
          <h2 className="section-title" style={{ color: "var(--green)" }}>
            You may also like
          </h2>
          <Scroller label="Related products">
            {related.map((r) => (
              <div role="listitem" key={r._id}>
                <ProductCard p={r} />
              </div>
            ))}
          </Scroller>
        </section>
      )}
    </>
  );
}
