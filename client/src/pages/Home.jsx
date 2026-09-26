import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Gift,
  ChefHat,
  Cookie,
  Apple,
  ShieldCheck,
  Leaf,
  Snowflake,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { get } from "../services/api.js";
import { useFetch } from "../utils/hooks.js";
import { img, date } from "../utils/format.js";
import { ProductCard, ExoCard, Scroller } from "../components/ProductCard.jsx";
import {
  Seo,
  ErrorState,
  Stars,
  Skeleton,
  ProductGridSkeleton,
} from "../components/Common.jsx";

const ORDER = [
  "Almond",
  "Cashews",
  "Raisins",
  "Walnuts",
  "Dates",
  "Pistachios",
  "Dried Berries",
  "Dried Fruits",
  "Roasted Nuts",
  "Seeds",
];
const PURPOSE_ICONS = [Gift, ChefHat, Cookie, Apple];
const TRUST_TILES = [
  [BadgeCheck, "Fssai certified"],
  [Leaf, "100% Organic & Natural"],
  [Snowflake, "Temperature controlled packaging"],
  [ShieldCheck, "Trust"],
];

function Hero({ banners = [] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return undefined;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (!banners.length) return null;
  const activeBanner = banners[index % banners.length];

  return (
    <section className="hero" aria-label="Featured offers">
      <Link to={activeBanner.ctaUrl || "/products"} className="hero-link">
        <img
          src={img(activeBanner.image?.url, 1800)}
          alt={`${activeBanner.title || "Banner"}. ${activeBanner.subtitle || ""}`}
          fetchpriority="high"
          width="1800"
          height="640"
        />
      </Link>
      {banners.length > 1 && (
        <div className="hero-dots" role="tablist" aria-label="Banner slides">
          {banners.map((_, k) => (
            <button
              key={k}
              className={k === index ? "on" : ""}
              onClick={() => setIndex(k)}
              aria-label={`Go to banner slide ${k + 1}`}
              aria-selected={k === index}
              role="tab"
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Testimonials({ list = [] }) {
  const [start, setStart] = useState(0);

  if (!list.length) return null;

  const shown = [0, 1, 2]
    .map((k) => list[(start + k) % list.length])
    .filter(Boolean)
    .slice(0, Math.min(3, list.length));

  return (
    <section className="testi" aria-label="Customer testimonials">
      <div className="testi-decor testi-decor-left" aria-hidden="true" />
      <div className="testi-decor testi-decor-right" aria-hidden="true" />

      <div className="container testi-container">
        <h2 className="testi-title">
          <span>Customer</span> <b>Testimonials</b>
        </h2>

        <div className="testi-grid">
          {shown.map((t, idx) => (
            <figure key={t._id || `${t.name}-${idx}`} className="testi-card">
              <div className="testi-quote" aria-hidden="true">
                “
              </div>

              <blockquote>{t.text}</blockquote>

              <div className="testi-bottom">
                <div className="testi-user">
                  <div className="avatar" aria-hidden="true">
                    {t.name ? t.name[0].toUpperCase() : "U"}
                  </div>

                  <div className="testi-user-info">
                    <strong>{t.name || "Customer"}</strong>

                    <span>Customer</span>

                    <div className="testi-stars">
                      <Stars n={t.rating} />
                    </div>
                  </div>
                </div>
              </div>
            </figure>
          ))}
        </div>

        {list.length > 3 && (
          <div className="testi-controls">
            <button
              className="testi-nav"
              onClick={() =>
                setStart((prev) => (prev - 1 + list.length) % list.length)
              }
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={22} strokeWidth={1.8} />
            </button>

            <button
              className="testi-nav"
              onClick={() => setStart((prev) => (prev + 1) % list.length)}
              aria-label="Next testimonial"
            >
              <ChevronRight size={22} strokeWidth={1.8} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const { data, loading, error, reload } = useFetch(
    () => get("/home").then((r) => r.data),
    [],
  );

  const categories = useMemo(() => {
    if (!data?.categories) return [];
    return ORDER.map((n) => data.categories.find((c) => c.name === n)).filter(
      Boolean,
    );
  }, [data?.categories]);

  if (error) {
    return (
      <div className="container">
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="container section">
        <Skeleton h={300} />
        <div style={{ height: 30 }} />
        <ProductGridSkeleton n={4} />
      </div>
    );
  }

  const {
    settings = {},
    banners = [],
    bestSellers = [],
    combos = [],
    exotic = [],
    blogs = [],
  } = data;
  const heroBanners = banners.filter((b) => b.position === "hero");
  const bulkBanner = banners.find((b) => b.position === "bulk");
  const storeBanner = banners.find((b) => b.position === "store");

  const formattedStoreTitle = storeBanner?.title
    ? storeBanner.title.replace("Are Not", "Aren't").replace(/^(Hey,)/, "$1")
    : "";

  return (
    <>
      <Seo
        title="Premium Dry Fruits, Nuts & Seeds Online"
        description="Buy fresh almonds, cashews, walnuts, dates, seeds and healthy snacks. FSSAI certified. Free delivery above Rs. 300."
        image="/img/logo.jpg"
      />

      <Hero banners={heroBanners} />

      {bestSellers.length > 0 && (
        <section className="section container">
          <h2 className="section-title">Our Best Sellers</h2>
          <Scroller label="Best sellers">
            {bestSellers.map((product, i) => (
              <div role="listitem" key={product._id}>
                <ProductCard p={product} priority={i < 3} />
              </div>
            ))}
          </Scroller>
        </section>
      )}

      {categories.length > 0 && (
        <section className="category-section">
          <div className="category-container">
            <h2 className="category-title">
              <span>Browse By</span> <b>Category</b>
            </h2>

            <div className="category-row">
              {categories.map((c) => (
                <Link
                  key={c._id}
                  to={`/category/${c.slug}`}
                  className="category-item"
                >
                  <div className="category-circle">
                    <img
                      src={img(c.image?.url, 180)}
                      alt={c.name}
                      loading="lazy"
                      width="120"
                      height="120"
                    />
                  </div>

                  <span>{c.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {combos.length > 0 && (
        <section className="combo-section">
          <div className="combo-container">
            <h2 className="combo-title">
              <span>Our</span> <b>Combo</b>
            </h2>

            <div className="combo-grid">
              {combos.map((product) => (
                <div className="combo-product" key={product._id}>
                  <ProductCard p={product} />
                </div>
              ))}
            </div>
          </div>

          {/* Decorative dry fruits */}
          <div className="combo-decoration" aria-hidden="true">
            <img src="/img/combo-decoration.png" alt="" />
          </div>
        </section>
      )}
      <section className="fresh-section">
        <div className="fresh-inner">
          <div className="trust-tiles">
            {TRUST_TILES.map(([Icon, label]) => (
              <div className="tile" key={label}>
                <div className="tile-icon">
                  <Icon size={34} />
                </div>

                <div className="tile-label">{label}</div>
              </div>
            ))}
          </div>

          <div className="fresh-content">
            <div className="eyebrow">Fresh &amp; Organic</div>

            <h2 className="big-serif">
              <span>40+ dry fruit </span>
              <b>range</b>
              <span> &amp; lot more</span>
            </h2>

            <p>
              By sourcing only the finest organic dry fruits and ensuring every
              step of our process meets the highest standards, we guarantee
              purity and authenticity in every pack.
            </p>
          </div>
        </div>
      </section>
      <Testimonials list={settings.testimonials || []} />

      {storeBanner && (
        <section className="store-section">
          <div className="store-container">
            {/* Store image */}
            <div className="store-image">
              <img
                src={img(storeBanner.image?.url, 1200)}
                alt="MS Punjabi Dry Fruits store"
                loading="lazy"
                width="1200"
                height="700"
              />
            </div>

            {/* Content */}
            <div className="store-content">
              <h2>
                <span>Hey, </span>
                <b>We Aren't That Far!</b>
              </h2>

              <p>
                Our journey has led us to broaden our network. Now, you can
                easily spot us at your nearest location and get your healthy
                eating plans sorted!
              </p>

              <div className="store-find">
                <strong>Find us Here</strong>

                <Link
                  to={storeBanner.ctaUrl || "/contact"}
                  className="store-location-btn"
                >
                  <span>{storeBanner.ctaText || "All Location"}</span>
                  <ChevronRight size={18} />
                </Link>
              </div>
            </div>

            {/* Statistics */}
            <div className="store-stats">
              {(settings.stats || []).slice(0, 3).map((s, index) => (
                <div className="store-stat" key={s.label}>
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {exotic.length > 0 && (
        <section className="section container">
          <h2 className="section-title">
            Top Selling{" "}
            <span style={{ color: "var(--brown)" }}>Exotic Nuts</span>
          </h2>
          <div className="exo-scroller">
            <Scroller label="Exotic nuts">
              {exotic.map((product) => (
                <div role="listitem" key={product._id}>
                  <ExoCard p={product} />
                </div>
              ))}
            </Scroller>
          </div>
        </section>
      )}

      {settings.purposes?.length > 0 && (
        <section className="purpose-section">
          <div className="purpose-container">
            <div className="purpose-header">
              <h2 className="purpose-title">
                <span>Shop</span> <b>By Purpose</b>
              </h2>

              <p>
                We just made it easy for you to shop on your terms. Let’s get
                started to find your way for Passion for Nutrition.
              </p>
            </div>

            <div className="purpose-grid">
              {settings.purposes.slice(0, 4).map((item, i) => {
                const Icon = PURPOSE_ICONS[i % PURPOSE_ICONS.length];

                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`purpose-card purpose-card-${i + 1}`}
                  >
                    <div className="purpose-icon">
                      <Icon size={58} strokeWidth={1.8} />
                    </div>

                    <div className="purpose-card-body">
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Decorative dry fruits */}
          <div className="purpose-decoration" aria-hidden="true">
            <img src="/img/purpose-nuts.png" alt="urpose-nuts" />
          </div>
        </section>
      )}

      {bulkBanner && (
        <section className="section container" style={{ paddingTop: 10 }}>
          <Link
            to={bulkBanner.ctaUrl || "/contact"}
            className="banner-img"
            style={{ display: "block" }}
          >
            <img
              src={img(bulkBanner.image?.url, 1400)}
              alt={`${bulkBanner.title || ""} ${bulkBanner.subtitle || ""}`}
              loading="lazy"
              width="1400"
              height="330"
            />
          </Link>
        </section>
      )}

      {blogs.length > 0 && (
        <section className="blogs-section">
          <div className="blogs-container">
            {/* Section heading */}
            <div className="blogs-header">
              <h2>
                <span>Our</span> <b>Recent Blogs</b>
              </h2>
            </div>

            {/* Blog cards */}
            <div className="blogs-grid">
              {blogs.slice(0, 3).map((b) => (
                <article className="blog-card-new" key={b._id}>
                  {/* Blog image */}
                  <Link to={`/blog/${b.slug}`} className="blog-image">
                    <img
                      src={img(b.image?.url, 900)}
                      alt={b.title || "Blog article"}
                      loading="lazy"
                      width="900"
                      height="560"
                    />
                  </Link>

                  {/* Overlapping content */}
                  <div className="blog-content">
                    {/* Meta row */}
                    <div className="blog-meta">
                      <div className="blog-author">
                        <div className="blog-avatar">
                          <img src="/img/logo.jpg" alt="" />
                        </div>

                        <div className="blog-author-info">
                          <strong>{b.author || "Admin"}</strong>

                          <span>{date(b.publishedAt)}</span>
                        </div>
                      </div>

                      <div className="blog-info-right">
                        <div className="blog-tags">
                          <span>{b.tag || "Healthy Lifestyle"}</span>

                          <span>{b.category || "Healthy Dessert"}</span>
                        </div>

                        <button
                          type="button"
                          className="blog-share"
                          aria-label={`Share ${b.title}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            if (navigator.share) {
                              navigator.share({
                                title: b.title,
                                url: window.location.origin + `/blog/${b.slug}`,
                              });
                            } else {
                              navigator.clipboard?.writeText(
                                window.location.origin + `/blog/${b.slug}`,
                              );
                            }
                          }}
                        >
                          ↗
                        </button>
                      </div>
                    </div>

                    <div className="blog-divider" />

                    {/* Title */}
                    <h3>
                      <Link to={`/blog/${b.slug}`}>{b.title}</Link>
                    </h3>

                    {/* Excerpt */}
                    <p>
                      {b.excerpt
                        ? b.excerpt.slice(0, 155) +
                          (b.excerpt.length > 155 ? "..." : "")
                        : ""}
                    </p>

                    {/* Read more */}
                    <Link to={`/blog/${b.slug}`} className="blog-read-more">
                      Read More...
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
