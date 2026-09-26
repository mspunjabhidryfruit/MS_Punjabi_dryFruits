import { createContext, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = ({
    title = "Confirm action",
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
  } = {}) =>
    new Promise((resolve) => {
      setState({
        title,
        message,
        confirmText,
        cancelText,
        resolve,
      });
    });

  const close = (result) => {
    setState((current) => {
      if (current?.resolve) current.resolve(result);
      return null;
    });
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          className="modal-back"
          onMouseDown={(e) => e.target === e.currentTarget && close(false)}
        >
          <div
            className="modal-box"
            role="dialog"
            aria-modal="true"
            aria-label={state.title}
            style={{ maxWidth: 440 }}
          >
            <div
              className="flex between"
              style={{ marginBottom: 14, alignItems: "center" }}
            >
              <h2 style={{ fontSize: 24, color: "var(--ink)" }}>
                {state.title}
              </h2>
              <button
                className="icon-btn"
                onClick={() => close(false)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            {state.message && (
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
                {state.message}
              </p>
            )}
            <div
              className="flex gap"
              style={{ justifyContent: "flex-end", marginTop: 20 }}
            >
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => close(false)}
              >
                {state.cancelText}
              </button>
              <button
                type="button"
                className="btn btn-yellow btn-sm"
                onClick={() => close(true)}
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    return async ({
      title = "Confirm action",
      message,
      confirmText = "Confirm",
      cancelText = "Cancel",
    } = {}) => {
      const ok = window.confirm(message || title);
      return Boolean(ok);
    };
  }
  return context;
}

export function Seo({ title, description, image, canonical }) {
  useEffect(() => {
    const full = title
      ? `${title} | MS Punjabi Dry Fruits`
      : "MS Punjabi Dry Fruits - Premium Dry Fruits, Nuts & Seeds";
    document.title = full;
    const set = (sel, attr, val, create) => {
      if (!val) return;
      let el = document.head.querySelector(sel);
      if (!el) {
        el = document.createElement(create.tag);
        Object.entries(create.attrs).forEach(([k, v]) => el.setAttribute(k, v));
        document.head.appendChild(el);
      }
      el.setAttribute(attr, val);
    };
    set('meta[name="description"]', "content", description, {
      tag: "meta",
      attrs: { name: "description" },
    });
    set('meta[property="og:title"]', "content", full, {
      tag: "meta",
      attrs: { property: "og:title" },
    });
    set('meta[property="og:description"]', "content", description, {
      tag: "meta",
      attrs: { property: "og:description" },
    });
    set(
      'meta[property="og:image"]',
      "content",
      image &&
        (image.startsWith("http") ? image : window.location.origin + image),
      { tag: "meta", attrs: { property: "og:image" } },
    );
    set(
      'link[rel="canonical"]',
      "href",
      canonical || window.location.origin + window.location.pathname,
      { tag: "link", attrs: { rel: "canonical" } },
    );
  }, [title, description, image, canonical]);
  return null;
}

export const Stars = ({ n = 5 }) => (
  <span className="stars" aria-label={`${n} out of 5 stars`}>
    {"★".repeat(Math.round(n))}
    {"☆".repeat(5 - Math.round(n))}
  </span>
);

export const Skeleton = ({ h = 20, w = "100%", style }) => (
  <div
    className="skeleton"
    style={{ height: h, width: w, ...style }}
    aria-hidden="true"
  />
);
export const ProductGridSkeleton = ({ n = 8 }) => (
  <div className="grid-products" aria-busy="true">
    {Array.from({ length: n }).map((_, i) => (
      <div key={i}>
        <Skeleton h={0} style={{ paddingBottom: "100%" }} />
        <Skeleton h={12} w="80%" style={{ marginTop: 14 }} />
        <Skeleton h={12} w="50%" style={{ marginTop: 8 }} />
        <Skeleton
          h={28}
          w="78%"
          style={{ margin: "12px auto 0", borderRadius: 20 }}
        />
      </div>
    ))}
  </div>
);

export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function ErrorState({ message, onRetry }) {
  return (
    <div className="empty" role="alert">
      <AlertTriangle size={36} color="#b3261e" />
      <h3>Something went wrong</h3>
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-yellow" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Crumbs({ items }) {
  return (
    <nav className="crumbs container" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <span key={i}>
          <span className="sep">›</span>
          {it.to ? (
            <Link to={it.to}>{it.label}</Link>
          ) : (
            <span style={{ color: "var(--orange)" }}>{it.label}</span>
          )}{" "}
        </span>
      ))}
    </nav>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  const nums = [];
  for (let i = 1; i <= pages; i += 1)
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
  return (
    <div className="pager" role="navigation" aria-label="Pagination">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>
      {nums.map((n, i) => (
        <span key={n} style={{ display: "contents" }}>
          {i > 0 && n - nums[i - 1] > 1 && (
            <span style={{ alignSelf: "center" }}>…</span>
          )}
          <button
            className={n === page ? "on" : ""}
            onClick={() => onChange(n)}
            aria-current={n === page ? "page" : undefined}
          >
            {n}
          </button>
        </span>
      ))}
      <button
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export function Field({ label, error, children, id }) {
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      {children}
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
