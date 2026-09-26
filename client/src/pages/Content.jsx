import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Truck,
  Award,
  Lock,
  MessageCircle,
  Phone,
  HelpCircle,
  Mail,
} from "lucide-react";
import toast from "react-hot-toast";
import { get, post } from "../services/api.js";
import { useFetch } from "../utils/hooks.js";
import { useSite } from "../context/site.jsx";
import { img, date } from "../utils/format.js";
import {
  Seo,
  Crumbs,
  ErrorState,
  Skeleton,
  Pagination,
  Empty,
} from "../components/Common.jsx";

export function About() {
  const values = [
    [
      "Quality",
      "We believe every product should meet high standards of freshness and taste.",
    ],
    [
      "Trust",
      "We build lasting relationships through transparency and consistency.",
    ],
    [
      "Freshness",
      "We take care in sourcing, storing, and packaging our products to preserve their natural goodness.",
    ],
    ["Customer First", "Our customers are at the heart of everything we do."],
    [
      "Innovation",
      "We continuously explore better products, packaging, and ways to serve our customers.",
    ],
  ];
  const { settings } = useSite();
  return (
    <>
      <Seo
        title="About Us"
        description="MS Punjabi Dry Fruits is a trusted name for premium-quality dry fruits, nuts, seeds and healthy snacks."
      />
      <Crumbs items={[{ label: "About Us" }]} />
      <div className="container about">
        <div className="page-banner">
          <img
            src="/img/about-us.jpg"
            alt="About us"
            width="1800"
            height="372"
          />
        </div>
        <h1 style={{ margin: "22px 0 16px" }}>
          MS Punjabi <b>Dry Fruits</b>
        </h1>
        <p>
          MS Punjabi Dry Fruits is a trusted name dedicated to bringing
          premium-quality dry fruits, nuts, seeds, and healthy snacks to
          customers. With a strong focus on freshness, authentic taste, and
          quality, we carefully source our products to ensure every bite meets
          our standards.
        </p>
        <p>
          From everyday favourites to premium and exotic dry fruits, our range
          is selected for its taste, nutritional value, and freshness. We
          believe that quality begins with careful sourcing and continues
          through hygienic processing, proper storage, and thoughtful packaging.
        </p>
        <p>
          At MS Punjabi Dry Fruits, our goal is simple to make premium dry
          fruits easily accessible while building lasting relationships with our
          customers through quality, trust, and excellent service.
        </p>
        <div className="two">
          <div>
            <h3 className="h">Our Mission</h3>
            <p>
              Our mission is to provide fresh, nutritious, and premium-quality
              dry fruits that add health and happiness to everyday life. We
              strive to deliver products that customers can enjoy and trust,
              while continuously improving our quality and service.
            </p>
          </div>
          <div>
            <h3 className="h">Our Vision</h3>
            <p>
              Our vision is to become a trusted and preferred dry fruit brand,
              known for exceptional quality, authentic taste, and customer
              satisfaction. We aim to grow with our customers while making
              healthy snacking a part of every lifestyle.
            </p>
          </div>
        </div>
        <h3 className="h">Our Value</h3>
        <div style={{ maxWidth: 520 }}>
          {values.map(([t, d]) => (
            <p key={t}>
              <b>{t} — </b>
              {d}
            </p>
          ))}
        </div>
        <div className="usp">
          <h2>USP</h2>
          <small>Fresh and Organic Foods delivered within a few clicks!</small>
        </div>
        <div className="usp-row">
          <div className="usp-item">
            <span className="usp-ico" style={{ background: "#e9f0a8" }}>
              <Truck size={16} />
            </span>
            <div>
              <b>GET A FREE DELIVERY ON</b>ORDERS ABOVE RS{" "}
              {settings.freeDeliveryThreshold}
            </div>
          </div>
          <div className="usp-item">
            <span className="usp-ico" style={{ background: "#ffbd59" }}>
              <Award size={16} />
            </span>
            <div>
              <b>QUALITY ASSURED</b>100% Original
            </div>
          </div>
          <div className="usp-item">
            <span className="usp-ico" style={{ background: "#fbe98a" }}>
              <Lock size={16} />
            </span>
            <div>
              <b>SECURE PAYMENT</b>Through SSL Payment Gateway
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function Contact() {
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await post("/contact", f);
      toast.success(r.data.message);
      setF({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <>
      <Seo
        title="Contact Us"
        description="Have a question or feedback? Get in touch with MS Punjabi Dry Fruits."
      />
      <Crumbs items={[{ label: "Contact" }]} />
      <div className="container">
        <div className="contact-hero">
          <div
            className="blob"
            style={{
              left: 30,
              top: 36,
              width: 90,
              height: 80,
              background: "#f8efc9",
            }}
          >
            <Mail size={34} color="#e9a0a0" />
          </div>
          <div
            className="blob"
            style={{
              right: 130,
              top: 20,
              width: 56,
              height: 50,
              background: "#e9efa0",
            }}
          >
            <MessageCircle size={22} color="#fff" />
          </div>
          <div
            className="blob"
            style={{
              right: 200,
              top: 84,
              width: 66,
              height: 66,
              background: "#f7a26c",
            }}
          >
            <Phone size={26} />
          </div>
          <div
            className="blob"
            style={{
              right: 60,
              top: 110,
              width: 62,
              height: 62,
              background: "#ffd02b",
            }}
          >
            <HelpCircle size={26} />
          </div>
          <h1>We’re happy to help</h1>
          <p>Have any queries or feedback. We would be happy to assist you.</p>
        </div>
      </div>
      <div className="wrap-white" style={{ marginTop: 6 }}>
        <form className="contact-form form-stack" onSubmit={submit}>
          <div className="grid-2">
            <input
              className="input"
              placeholder="Name"
              aria-label="Name"
              required
              minLength={2}
              maxLength={80}
              value={f.name}
              onChange={set("name")}
            />
            <input
              className="input"
              type="email"
              placeholder="Email"
              aria-label="Email"
              required
              value={f.email}
              onChange={set("email")}
            />
          </div>
          <input
            className="input"
            placeholder="Phone number"
            aria-label="Phone number"
            inputMode="tel"
            maxLength={20}
            value={f.phone}
            onChange={set("phone")}
          />
          <textarea
            className="textarea"
            placeholder="Comment"
            aria-label="Comment"
            required
            minLength={5}
            maxLength={3000}
            value={f.message}
            onChange={set("message")}
          />
          <div>
            <button
              className="btn btn-yellow"
              style={{ borderRadius: 6, minWidth: 154 }}
              disabled={busy}
            >
              {busy ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export function Blog() {
  const [sp] = useSearchParams();
  const type = sp.get("type") === "news" ? "news" : "";

  const [page, setPage] = useState(1);

  const { data, loading, error, reload } = useFetch(
    () =>
      get("/blog", {
        page,
        type: type || "blog",
        limit: 9,
      }).then((r) => ({
        items: r.data.items,
        pg: r.pagination,
      })),
    [page, type],
  );

  return (
    <>
      <Seo
        title={type ? "News" : "Blog"}
        description="Recipes, gifting ideas and news from MS Punjabi Dry Fruits."
      />

      <Crumbs
        items={[
          {
            label: type ? "News" : "Blog",
          },
        ]}
      />

      <section className="blogs-section">
        <div className="blogs-container">
          {/* Header */}
          <div className="blogs-header">
            <h2>
              {type ? (
                <>
                  Latest <b>News</b>
                </>
              ) : (
                <>
                  Our Recent <b>Blogs</b>
                </>
              )}
            </h2>
          </div>

          {/* Loading */}
          {loading && !data ? (
            <Skeleton h={300} />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data?.items?.length ? (
            <Empty title="Nothing here yet">Check back soon.</Empty>
          ) : (
            <div className="blogs-grid">
              {data.items.map((b) => (
                <article className="blog-card-new" key={b._id}>
                  {/* Image */}
                  <Link to={`/blog/${b.slug}`} className="blog-image">
                    <img
                      src={img(b.image?.url, 800)}
                      alt={b.title || "Blog"}
                      loading="lazy"
                    />
                  </Link>

                  {/* Content */}
                  <div className="blog-content">
                    <div className="blog-meta">
                      <div className="blog-author">
                        <div className="blog-avatar">
                          <div className="blog-avatar-placeholder">
                            {(b.author || "A").charAt(0).toUpperCase()}
                          </div>
                        </div>

                        <div className="blog-author-info">
                          <strong>{b.author || "Admin"}</strong>

                          <span>{date(b.publishedAt)}</span>
                        </div>
                      </div>

                      <div className="blog-info-right">
                        {b.tag && (
                          <div className="blog-tags">
                            <span>{b.tag}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="blog-divider" />

                    <h3>
                      <Link to={`/blog/${b.slug}`}>{b.title}</Link>
                    </h3>

                    <p>{b.excerpt}</p>

                    <Link to={`/blog/${b.slug}`} className="blog-read-more">
                      Read More →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data?.pg && (
            <Pagination
              page={data.pg.page}
              pages={data.pg.pages}
              onChange={setPage}
            />
          )}
        </div>
      </section>
    </>
  );
}
export function BlogPost() {
  const { slug } = useParams();
  const { data, loading, error, reload } = useFetch(
    () => get(`/blog/${slug}`).then((r) => r.data.post),
    [slug],
  );
  if (error)
    return (
      <div className="container page">
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  if (loading || !data)
    return (
      <div className="container page">
        <Skeleton h={300} />
      </div>
    );
  return (
    <>
      <Seo
        title={data.title}
        description={data.excerpt}
        image={data.image?.url}
      />
      <Crumbs items={[{ label: "Blog", to: "/blog" }, { label: data.title }]} />
      <article
        className="container page"
        style={{ maxWidth: 780, paddingTop: 0 }}
      >
        <span className="tag">{data.tag}</span>
        <h1 style={{ margin: "10px 0" }}>{data.title}</h1>
        <div className="muted" style={{ fontSize: 12, marginBottom: 16 }}>
          {data.author} · {date(data.publishedAt)}
        </div>
        {data.image?.url && (
          <img
            src={img(data.image.url, 1000)}
            alt=""
            style={{ borderRadius: 12, marginBottom: 20, width: "100%" }}
          />
        )}
        <p style={{ fontWeight: 600 }}>{data.excerpt}</p>
        {data.content.split(/\n{2,}|\n/).map((p, i) => (
          <p key={i} style={{ lineHeight: 1.9 }}>
            {p}
          </p>
        ))}
      </article>
    </>
  );
}

const POLICIES = {
  privacy: [
    "Privacy Policy",
    [
      "We collect only the information needed to process your orders and improve your experience: your name, email, phone number and delivery address.",
      "Passwords are stored using one-way hashing. Payments are processed by Razorpay; we never see or store your card details.",
      "We do not sell your personal data. You can request deletion of your account by contacting us.",
    ],
  ],
  terms: [
    "Terms & Conditions",
    [
      "By using this website you agree to these terms. Product images are for illustration; packaging may vary slightly.",
      "Prices and availability may change without notice. We may cancel orders affected by pricing errors or stock shortages and will refund any amount paid.",
      "All disputes are subject to the jurisdiction of the courts in India.",
    ],
  ],
  refund: [
    "Return & Refund Policy",
    [
      "Because dry fruits are consumable, we accept returns only for damaged, defective or incorrect products reported within 7 days of delivery.",
      "Contact us with your order number and photos. Approved refunds go to the original payment method within 5-7 working days; COD refunds are made by bank transfer.",
    ],
  ],
  shipping: [
    "Shipping Policy",
    [
      "We deliver across India. Orders are packed within 24-48 hours and typically arrive in 3-7 days depending on your location.",
      "Delivery is free above the configured order value shown at checkout; a small delivery charge applies below it.",
    ],
  ],
  manufacturing: [
    "Manufacturing Units",
    [
      "Our products are processed, sorted and packed in FSSAI certified facilities following strict hygiene and quality control standards.",
    ],
  ],
};
export function Policy() {
  const { slug } = useParams();
  const p = POLICIES[slug];
  if (!p) return <NotFound />;
  return (
    <div className="container page" style={{ maxWidth: 800 }}>
      <Seo title={p[0]} description={p[1][0]} />
      <h1>{p[0]}</h1>
      {p[1].map((t, i) => (
        <p key={i} style={{ lineHeight: 1.9 }}>
          {t}
        </p>
      ))}
      <p className="muted">
        Questions?{" "}
        <Link className="link-btn" to="/contact">
          Contact us
        </Link>
        .
      </p>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="container page">
      <Seo title="Page not found" description="This page could not be found." />
      <Empty
        title="404 - Page not found"
        action={
          <Link className="btn btn-yellow" to="/">
            Back to home
          </Link>
        }
      >
        The page you are looking for does not exist or has moved.
      </Empty>
    </div>
  );
}
