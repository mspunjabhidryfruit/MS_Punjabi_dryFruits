import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { get, post, put, del } from "../services/api.js";
import { useFetch, useDebounced } from "../utils/hooks.js";
import { img, inr } from "../utils/format.js";
import {
  Field,
  ErrorState,
  Skeleton,
  Pagination,
  Seo,
  useConfirm,
} from "../components/Common.jsx";
import { ImageUploader, PageHead } from "./ui.jsx";

export function AdminProducts() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [stock, setStock] = useState("");
  const confirm = useConfirm();
  const dq = useDebounced(q);
  const { data, loading, error, reload } = useFetch(
    () =>
      get("/admin/products", {
        q: dq || undefined,
        page,
        stock: stock || undefined,
        limit: 15,
      }).then((r) => ({ items: r.data.items, pg: r.pagination })),
    [dq, page, stock],
  );
  const remove = async (p) => {
    const ok = await confirm({
      title: "Delete product",
      message: `Delete "${p.name}"? This cannot be undone.`,
      confirmText: "Delete",
    });
    if (!ok) return;
    try {
      await del(`/admin/products/${p._id}`);
      toast.success("Product deleted");
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };
  return (
    <div>
      <Seo title="Products (admin)" description="Admin" />
      <PageHead title="Products">
        <Link to="/admin/products/new" className="btn btn-yellow btn-sm">
          + New product
        </Link>
      </PageHead>
      <div className="toolbar">
        <input
          className="input"
          placeholder="Search products"
          aria-label="Search products"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="select"
          aria-label="Stock filter"
          value={stock}
          onChange={(e) => {
            setStock(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All stock</option>
          <option value="low">Low stock (10 or fewer)</option>
        </select>
      </div>
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <Skeleton h={300} />
      ) : (
        <div className="adm-card tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th />
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Visible</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p._id}>
                  <td>
                    <img
                      src={img(p.images?.[0]?.url, 80)}
                      alt=""
                      width="64"
                      height="64"
                      style={{
                        width: "64px",
                        height: "64px",
                        minWidth: "64px",
                        minHeight: "64px",
                        borderRadius: "8px",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </td>
                  <td>
                    <b>{p.name}</b>
                    <div className="muted" style={{ fontSize: 11 }}>
                      {p.weightLabels?.join(", ")}
                    </div>
                  </td>
                  <td>{p.category?.name}</td>
                  <td>{inr(p.price)}</td>
                  <td
                    style={{
                      color: p.totalStock <= 10 ? "#b3261e" : undefined,
                    }}
                  >
                    {p.totalStock}
                  </td>
                  <td>
                    <span
                      className={`status ${p.visible ? "active" : "disabled"}`}
                    >
                      {p.visible ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap">
                      <Link
                        className="link-btn"
                        to={`/admin/products/${p._id}/edit`}
                      >
                        Edit
                      </Link>

                      <button
                        className="link-btn"
                        style={{ color: "#b3261e" }}
                        onClick={() => remove(p)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!data.items.length && (
                <tr>
                  <td colSpan={7} className="muted">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination
            page={data.pg.page}
            pages={data.pg.pages}
            onChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

const blank = {
  name: "",
  category: "",
  collections: [],
  shortDescription: "",
  description: "",
  benefits: "",
  highlights: "",
  tags: "",
  packLabel: "Pack of 1",
  badge: "",
  visible: true,
  isBestSeller: false,
  isCombo: false,
  isExotic: false,
  featured: false,
  images: [],
  variants: [{ weight: "250g", price: "", mrp: "", stock: 0, sku: "" }],
};
const lines = (s) =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

export function ProductForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const confirm = useConfirm();
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const meta = useFetch(
    () =>
      Promise.all([
        get("/admin/categories", { limit: 100 }),
        get("/admin/collections", { limit: 100 }),
      ]).then(([c, k]) => ({ cats: c.data.items, cols: k.data.items })),
    [],
  );
  const prod = useFetch(
    () =>
      id
        ? get(`/admin/products/${id}`).then((r) => r.data.item)
        : Promise.resolve(null),
    [id],
  );
  useEffect(() => {
    const p = prod.data;
    if (p)
      setF({
        ...blank,
        ...p,
        category: p.category,
        collections: p.collections || [],
        benefits: (p.benefits || []).join("\n"),
        highlights: (p.highlights || []).join("\n"),
        tags: (p.tags || []).join(", "),
        variants: p.variants.map((v) => ({ ...v, mrp: v.mrp || "" })),
      });
  }, [prod.data]);
  if (prod.error)
    return <ErrorState message={prod.error} onRetry={prod.reload} />;
  if (meta.error)
    return <ErrorState message={meta.error} onRetry={meta.reload} />;
  if ((id && prod.loading) || meta.loading) return <Skeleton h={400} />;

  const set = (k) => (e) =>
    setF({
      ...f,
      [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  const setV = (i, k, v) =>
    setF({
      ...f,
      variants: f.variants.map((x, j) => (j === i ? { ...x, [k]: v } : x)),
    });
  const submit = async (e) => {
    e.preventDefault();
    const body = {
      name: f.name,
      category: f.category,
      collections: f.collections,
      shortDescription: f.shortDescription,
      description: f.description,
      benefits: lines(f.benefits),
      highlights: lines(f.highlights),
      tags: f.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      packLabel: f.packLabel,
      badge: f.badge,
      visible: f.visible,
      isBestSeller: f.isBestSeller,
      isCombo: f.isCombo,
      isExotic: f.isExotic,
      featured: f.featured,
      images: f.images.map(({ url, publicId }) => ({ url, publicId })),
      variants: f.variants.map((v) => ({
        ...(v._id ? { _id: v._id } : {}),
        weight: v.weight,
        price: Number(v.price),
        mrp: v.mrp === "" ? undefined : Number(v.mrp),
        stock: Number(v.stock),
        sku: v.sku || undefined,
      })),
    };
    if (!body.images.length) {
      toast.error("Upload at least one product image");
      return;
    }
    setBusy(true);
    try {
      await (id
        ? put(`/admin/products/${id}`, body)
        : post("/admin/products", body));
      toast.success(id ? "Product updated" : "Product created");
      nav("/admin/products");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  const Chk = ({ k, label }) => (
    <label
      style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}
    >
      <input type="checkbox" checked={f[k]} onChange={set(k)} />
      {label}
    </label>
  );

  return (
    <form onSubmit={submit}>
      <Seo title={id ? "Edit product" : "New product"} description="Admin" />
      <PageHead title={id ? "Edit product" : "New product"}>
        <Link to="/admin/products" className="btn btn-outline btn-sm">
          Cancel
        </Link>
        <button className="btn btn-yellow btn-sm" disabled={busy}>
          {busy ? "Saving..." : "Save product"}
        </button>
      </PageHead>
      <div className="adm-grid-3">
        <div className="form-stack">
          <div className="adm-card form-stack">
            <Field label="Name" id="pn">
              <input
                id="pn"
                className="input"
                required
                minLength={2}
                value={f.name}
                onChange={set("name")}
              />
            </Field>
            <Field label="Short description" id="sd">
              <input
                id="sd"
                className="input"
                maxLength={240}
                value={f.shortDescription}
                onChange={set("shortDescription")}
              />
            </Field>
            <Field label="Description" id="ds">
              <textarea
                id="ds"
                className="textarea"
                style={{ minHeight: 140 }}
                value={f.description}
                onChange={set("description")}
              />
            </Field>
            <div className="grid-2">
              <Field label="Benefits (one per line)" id="bn">
                <textarea
                  id="bn"
                  className="textarea"
                  value={f.benefits}
                  onChange={set("benefits")}
                />
              </Field>
              <Field label="Highlights (one per line)" id="hl">
                <textarea
                  id="hl"
                  className="textarea"
                  value={f.highlights}
                  onChange={set("highlights")}
                />
              </Field>
            </div>
          </div>
          <div className="adm-card">
            <b>Weight options &amp; pricing</b>
            <div style={{ marginTop: 10 }}>
              {f.variants.map((v, i) => (
                <div className="vrow" key={v._id || i}>
                  <Field label="Weight" id={`w${i}`}>
                    <input
                      id={`w${i}`}
                      className="input"
                      required
                      value={v.weight}
                      onChange={(e) => setV(i, "weight", e.target.value)}
                    />
                  </Field>
                  <Field label="Sale price" id={`p${i}`}>
                    <input
                      id={`p${i}`}
                      className="input"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={v.price}
                      onChange={(e) => setV(i, "price", e.target.value)}
                    />
                  </Field>
                  <Field label="MRP" id={`m${i}`}>
                    <input
                      id={`m${i}`}
                      className="input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={v.mrp}
                      onChange={(e) => setV(i, "mrp", e.target.value)}
                    />
                  </Field>
                  <Field label="Stock" id={`s${i}`}>
                    <input
                      id={`s${i}`}
                      className="input"
                      type="number"
                      min="0"
                      required
                      value={v.stock}
                      onChange={(e) => setV(i, "stock", e.target.value)}
                    />
                  </Field>
                  <Field label="SKU" id={`k${i}`}>
                    <input
                      id={`k${i}`}
                      className="input"
                      value={v.sku || ""}
                      onChange={(e) => setV(i, "sku", e.target.value)}
                    />
                  </Field>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={f.variants.length < 2}
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Remove option",
                        message: "Remove this weight option?",
                        confirmText: "Remove",
                      });
                      if (!ok) return;
                      setF({
                        ...f,
                        variants: f.variants.filter((_, j) => j !== i),
                      });
                    }}
                    aria-label="Remove option"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() =>
                setF({
                  ...f,
                  variants: [
                    ...f.variants,
                    { weight: "", price: "", mrp: "", stock: 0, sku: "" },
                  ],
                })
              }
            >
              + Add weight option
            </button>
          </div>
          <div className="adm-card">
            <b>Images</b>
            <div style={{ marginTop: 10 }}>
              <ImageUploader
                value={f.images}
                onChange={(images) => setF({ ...f, images })}
              />
            </div>
            <p className="muted" style={{ fontSize: 11 }}>
              The first image is the main image. JPG, PNG, WEBP up to 5 MB.
            </p>
          </div>
        </div>
        <div className="form-stack">
          <div className="adm-card form-stack">
            <Field label="Category" id="cat">
              <select
                id="cat"
                className="select"
                required
                value={f.category}
                onChange={set("category")}
              >
                <option value="">Select category</option>
                {meta.data.cats.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="field">
              <label>Collections</label>
              {meta.data.cols.map((c) => (
                <label
                  key={c._id}
                  style={{ fontSize: 13, display: "flex", gap: 6 }}
                >
                  <input
                    type="checkbox"
                    checked={f.collections.includes(c._id)}
                    onChange={(e) =>
                      setF({
                        ...f,
                        collections: e.target.checked
                          ? [...f.collections, c._id]
                          : f.collections.filter((x) => x !== c._id),
                      })
                    }
                  />
                  {c.name}
                </label>
              ))}
            </div>
            <Field label="Tags (comma separated)" id="tg">
              <input
                id="tg"
                className="input"
                value={f.tags}
                onChange={set("tags")}
              />
            </Field>
            <div className="grid-2">
              <Field label="Pack label" id="pl">
                <input
                  id="pl"
                  className="input"
                  value={f.packLabel}
                  onChange={set("packLabel")}
                />
              </Field>
              <Field label="Offer badge" id="bg">
                <input
                  id="bg"
                  className="input"
                  placeholder="Pack of 2"
                  value={f.badge}
                  onChange={set("badge")}
                />
              </Field>
            </div>
          </div>
          <div className="adm-card form-stack">
            <b>Visibility &amp; placement</b>
            <Chk k="visible" label="Visible in store" />
            <Chk k="isBestSeller" label="Best seller (home)" />
            <Chk k="isCombo" label="Combo (home)" />
            <Chk k="isExotic" label="Exotic nut (home)" />
            <Chk k="featured" label="Featured" />
          </div>
        </div>
      </div>
    </form>
  );
}
