import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import {
  ChevronDown,
  Plus,
  Minus,
  Leaf,
  Package,
  ShieldCheck,
  ThumbsUp,
} from "lucide-react";
import { get } from "../services/api.js";
import { useFetch, useDebounced } from "../utils/hooks.js";
import { ProductCard } from "../components/ProductCard.jsx";
import {
  Seo,
  Crumbs,
  Pagination,
  ProductGridSkeleton,
  ErrorState,
  Empty,
} from "../components/Common.jsx";
import { useSite } from "../context/site.jsx";

const SORTS = [
  ["featured", "Featured"],
  ["price-asc", "Price, low to high"],
  ["price-desc", "Price, high to low"],
  ["newest", "Newest"],
  ["best", "Best selling"],
];

export function Faq() {
  const { settings } = useSite();
  const [open, setOpen] = useState(0);

  if (!settings.faqs?.length) return null;

  return (
    <section className="faq-section" aria-label="Frequently asked questions">
      <div className="faq-decoration faq-decoration-left" aria-hidden="true" />
      <div className="faq-decoration faq-decoration-right" aria-hidden="true" />

      <div className="faq-container">
        <div className="faq-list">
          {settings.faqs.map((f, i) => (
            <div className="faq-item" key={i}>
              <button
                className="faq-question"
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? -1 : i)}
              >
                <span>{f.q}</span>

                <span className="faq-icon">
                  {open === i ? (
                    <Minus size={24} strokeWidth={1.5} />
                  ) : (
                    <Plus size={24} strokeWidth={1.5} />
                  )}
                </span>
              </button>

              {open === i && <div className="faq-answer">{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const QUALITY = [
  [
    ThumbsUp,
    "HANDPICKED",
    "Every dry fruit is carefully hand-picked to ensure the finest quality of your snack time.",
  ],
  [
    Leaf,
    "NUTRIENT RICH",
    "Our dry fruits are packed with essential vitamins and minerals to support your overall wellbeing.",
  ],
  [
    Package,
    "PREMIUM PACKAGING",
    "We make sure that the product is sealed in top-grade airtight packaging to lock in freshness.",
  ],
  [
    ShieldCheck,
    "QUALITY CONTROL",
    "Our stringent quality control ensures that only the best reaches your table.",
  ],
];

export default function Products({ mode = "all" }) {
  const { slug } = useParams();
  const [sp, setSp] = useSearchParams();
  const [pop, setPop] = useState("");
  const isSearch = mode === "search";
  const q = sp.get("q") || "";
  const page = Number(sp.get("page")) || 1;
  const sort = sp.get("sort") || "featured";
  const weight = sp.get("weight") || "";
  const availability = sp.get("availability") || "";
  const [minP, setMinP] = useState(sp.get("minPrice") || "");
  const [maxP, setMaxP] = useState(sp.get("maxPrice") || "");
  const dMin = useDebounced(minP, 500);
  const dMax = useDebounced(maxP, 500);

  const set = (patch) => {
    const n = new URLSearchParams(sp);
    Object.entries({ page: "", ...patch }).forEach(([k, v]) =>
      v ? n.set(k, v) : n.delete(k),
    );
    setSp(n, { replace: true });
  };
  useEffect(() => {
    if (
      (sp.get("minPrice") || "") !== dMin ||
      (sp.get("maxPrice") || "") !== dMax
    )
      set({ minPrice: dMin, maxPrice: dMax });
  }, [dMin, dMax]); // eslint-disable-line react-hooks/exhaustive-deps

  const cat = useFetch(
    () =>
      mode === "category"
        ? get(`/categories/${slug}`).then((r) => r.data.category)
        : Promise.resolve(null),
    [mode, slug],
  );
  const params = {
    page,
    limit: 12,
    sort,
    weight: weight || undefined,
    availability: availability || undefined,
    minPrice: sp.get("minPrice") || undefined,
    maxPrice: sp.get("maxPrice") || undefined,
    q: q || undefined,
    category: mode === "category" ? slug : undefined,
  };
  const list = useFetch(
    () =>
      get("/products", params).then((r) => ({
        items: r.data.items,
        weights: r.data.weights,
        pg: r.pagination,
      })),
    [JSON.stringify(params)],
  );

  if (mode === "category" && cat.error)
    return (
      <div className="container">
        <ErrorState message={cat.error} onRetry={cat.reload} />
      </div>
    );
  const title = isSearch
    ? `Search results for “${q}”`
    : mode === "category"
      ? cat.data?.name || "Loading"
      : "All Products";
  const heroImg = mode === "category" ? "/img/hero-snacking.jpg" : null;
  const total = list.data?.pg?.total ?? 0;

  return (
    <>
      <Seo
        title={title.replace(/[“”]/g, "")}
        description={
          cat.data?.description ||
          "Shop premium dry fruits, nuts, seeds and healthy snacks from MS Punjabi Dry Fruits."
        }
        image={cat.data?.image?.url}
      />
      <Crumbs
        items={[
          {
            label: isSearch
              ? "Search"
              : mode === "category"
                ? `Buy ${cat.data?.name || ""} Online`
                : "Products",
          },
        ]}
      />

      {!isSearch && (
        <section className="category-hero">
          <img
            src={heroImg || "/img/hero-snacking.jpg"}
            alt={`${title} banner`}
            width="1800"
            height="640"
            loading="eager"
          />
        </section>
      )}

      <div className="container">
        {isSearch && (
          <section className="category-hero">
            <img
              src={heroImg || "/img/hero-snacking.jpg"}
              alt={`${title} banner`}
              width="1800"
              height="640"
              loading="eager"
            />
          </section>
        )}
        {isSearch && (
          <h1 style={{ fontSize: 30, margin: "10px 0" }}>{title}</h1>
        )}
        <div className="filters">
          <span>Filter:</span>
          <div style={{ position: "relative" }}>
            <button
              className="fbtn"
              onClick={() => setPop(pop === "price" ? "" : "price")}
              aria-expanded={pop === "price"}
            >
              Price <ChevronDown size={12} />
            </button>
            {pop === "price" && (
              <div className="fpop">
                <div className="grid-2">
                  <div className="field">
                    <label htmlFor="minp">From (Rs.)</label>
                    <input
                      id="minp"
                      className="input"
                      type="number"
                      min="0"
                      value={minP}
                      onChange={(e) => setMinP(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="maxp">To (Rs.)</label>
                    <input
                      id="maxp"
                      className="input"
                      type="number"
                      min="0"
                      value={maxP}
                      onChange={(e) => setMaxP(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  className="link-btn"
                  style={{ marginTop: 10, fontSize: 12 }}
                  onClick={() => {
                    setMinP("");
                    setMaxP("");
                  }}
                >
                  Reset
                </button>
              </div>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <button
              className="fbtn"
              onClick={() => setPop(pop === "weight" ? "" : "weight")}
              aria-expanded={pop === "weight"}
            >
              Weight <ChevronDown size={12} />
            </button>
            {pop === "weight" && (
              <div className="fpop">
                {(list.data?.weights || []).map((w) => (
                  <button
                    key={w}
                    className={`chip ${weight === w ? "on" : ""}`}
                    onClick={() => set({ weight: weight === w ? "" : w })}
                  >
                    {w}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <button
              className="fbtn"
              onClick={() => setPop(pop === "avail" ? "" : "avail")}
              aria-expanded={pop === "avail"}
            >
              Availability <ChevronDown size={12} />
            </button>
            {pop === "avail" && (
              <div className="fpop">
                {[
                  ["in", "In stock"],
                  ["out", "Out of stock"],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    className={`chip ${availability === v ? "on" : ""}`}
                    onClick={() =>
                      set({ availability: availability === v ? "" : v })
                    }
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="spacer" />
          <label htmlFor="sort">Sort by:</label>
          <select
            id="sort"
            className="select"
            style={{ width: 170, padding: "6px 8px", fontSize: 11 }}
            value={sort}
            onChange={(e) =>
              set({ sort: e.target.value === "featured" ? "" : e.target.value })
            }
          >
            {SORTS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <span>{total} products</span>
        </div>
        {list.loading && !list.data ? (
          <ProductGridSkeleton n={8} />
        ) : list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : !list.data.items.length ? (
          <Empty
            title="No products found"
            action={
              <Link
                className="btn btn-yellow"
                to="/products"
                onClick={() => {
                  setMinP("");
                  setMaxP("");
                }}
              >
                Clear filters
              </Link>
            }
          >
            {isSearch
              ? `Nothing matched “${q}”. Try a different word.`
              : "Try changing or clearing your filters."}
          </Empty>
        ) : (
          <div
            style={{
              opacity: list.loading ? 0.5 : 1,
              transition: "opacity .2s",
            }}
          >
            <div className="grid-products">
              {list.data.items.map((p, i) => (
                <ProductCard key={p._id} p={p} priority={i < 4} />
              ))}
            </div>
          </div>
        )}
        <Pagination
          page={list.data?.pg?.page || 1}
          pages={list.data?.pg?.pages}
          onChange={(n) => {
            set({ page: String(n) });
            window.scrollTo({ top: 300, behavior: "smooth" });
          }}
        />
      </div>
      <section className="strip" style={{ marginTop: 40 }}>
        <div className="container" style={{ display: "contents" }}>
          {QUALITY.map(([I, t, d]) => (
            <div key={t}>
              <I size={22} color="#1f7a8c" />
              <h5>{t}</h5>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>
      <Faq />
    </>
  );
}
