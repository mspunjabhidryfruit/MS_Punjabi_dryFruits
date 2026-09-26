import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { get, post, put, del } from "../services/api.js";
import { useFetch, useDebounced } from "../utils/hooks.js";
import { img, date } from "../utils/format.js";
import {
  Field,
  ErrorState,
  Skeleton,
  Pagination,
  Seo,
  useConfirm,
} from "../components/Common.jsx";
import { Modal, ImageUploader, PageHead } from "./ui.jsx";

const dt = (v) => {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  try {
    return new Date(v).toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

function Form({ cfg, item, onDone, onCancel }) {
  const initialData = useMemo(() => {
    return { ...cfg.defaults, ...(item || {}) };
  }, [cfg.defaults, item]);

  const [f, setF] = useState(initialData);
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const body = {};

    cfg.fields.forEach((fl) => {
      let v = f[fl.name];
      if (fl.type === "number") {
        v = v === "" || v === undefined || v === null ? undefined : Number(v);
      } else if (fl.type === "date") {
        v = v ? v : null;
      } else if (fl.type === "image") {
        v = v?.url ? { url: v.url, publicId: v.publicId } : undefined;
      }
      body[fl.name] = v;
    });

    setBusy(true);
    try {
      if (item?._id) {
        await put(`${cfg.endpoint}/${item._id}`, body);
      } else {
        await post(cfg.endpoint, body);
      }
      toast.success("Saved successfully");
      onDone();
    } catch (err) {
      toast.error(err?.message || "An error occurred while saving.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="grid-2">
        {cfg.fields.map((fl) => {
          const id = `f-${fl.name}`;
          const wide = ["textarea", "image"].includes(fl.type);

          return (
            <div
              key={fl.name}
              style={wide ? { gridColumn: "1 / -1" } : undefined}
            >
              {fl.type === "checkbox" ? (
                <label
                  style={{
                    display: "flex",
                    gap: 8,
                    fontSize: 13,
                    alignItems: "center",
                    paddingTop: 22,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(f[fl.name])}
                    onChange={(e) => set(fl.name, e.target.checked)}
                  />
                  {fl.label}
                </label>
              ) : (
                <Field label={fl.label} id={id}>
                  {fl.type === "textarea" ? (
                    <textarea
                      id={id}
                      className="textarea"
                      value={f[fl.name] ?? ""}
                      onChange={(e) => set(fl.name, e.target.value)}
                      required={fl.required}
                    />
                  ) : fl.type === "select" ? (
                    <select
                      id={id}
                      className="select"
                      value={f[fl.name] ?? ""}
                      onChange={(e) => set(fl.name, e.target.value)}
                    >
                      {fl.options?.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : fl.type === "image" ? (
                    <ImageUploader
                      multiple={false}
                      folder={cfg.folder}
                      value={f[fl.name]?.url ? [f[fl.name]] : []}
                      onChange={(a) => set(fl.name, a[0])}
                    />
                  ) : (
                    <input
                      id={id}
                      className="input"
                      type={fl.type === "date" ? "date" : fl.type || "text"}
                      step={fl.type === "number" ? "any" : undefined}
                      value={
                        fl.type === "date" ? dt(f[fl.name]) : (f[fl.name] ?? "")
                      }
                      onChange={(e) => set(fl.name, e.target.value)}
                      required={fl.required}
                    />
                  )}
                </Field>
              )}
            </div>
          );
        })}
      </div>
      <div
        className="flex gap"
        style={{ justifyContent: "flex-end", marginTop: 16 }}
      >
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-yellow btn-sm" disabled={busy}>
          {busy ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

export default function Crud({ cfg }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState(null);
  const confirm = useConfirm();

  const dq = useDebounced(q);

  const { data, loading, error, reload } = useFetch(
    () =>
      get(cfg.endpoint, { q: dq || undefined, page, limit: 15 }).then((r) => ({
        items: r.data?.items || [],
        pg: r.pagination || { page: 1, pages: 1 },
      })),
    [cfg.endpoint, dq, page],
  );

  const remove = async (it) => {
    const ok = await confirm({
      title: "Delete item",
      message: "Delete this item? This cannot be undone.",
      confirmText: "Delete",
    });
    if (!ok) return;
    try {
      await del(`${cfg.endpoint}/${it._id}`);
      toast.success("Deleted");
      reload();
    } catch (e) {
      toast.error(e?.message || "Failed to delete");
    }
  };

  const toggle = async (it) => {
    const action = it.active ? "Disable" : "Enable";
    const ok = await confirm({
      title: `${action} item`,
      message: `${action} this item?`,
      confirmText: action,
    });
    if (!ok) return;
    try {
      await put(`${cfg.endpoint}/${it._id}`, { ...it, active: !it.active });
      toast.success(it.active ? "Disabled" : "Enabled");
      reload();
    } catch (e) {
      toast.error(e?.message || `Failed to ${action.toLowerCase()}`);
    }
  };

  const items = data?.items || [];
  const pg = data?.pg || { page: 1, pages: 1 };

  return (
    <div>
      <Seo title={`${cfg.title} (admin)`} description="Admin CRUD Management" />
      <PageHead title={cfg.title}>
        <button className="btn btn-yellow btn-sm" onClick={() => setEdit({})}>
          + New
        </button>
      </PageHead>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search..."
          aria-label={`Search ${cfg.title}`}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <Skeleton h={250} />
      ) : (
        <div className="adm-card tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                {cfg.image && <th aria-label="Thumbnail" />}
                {cfg.columns.map((c) => (
                  <th key={c.label}>{c.label}</th>
                ))}
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it._id}>
                  {cfg.image && (
                    <td>
                      {it.image?.url && (
                        <img
                          src={img(it.image.url, 80)}
                          alt={it.name || it.title || "Item image"}
                          width="44"
                          height="44"
                          style={{ borderRadius: 6, objectFit: "cover" }}
                        />
                      )}
                    </td>
                  )}
                  {cfg.columns.map((c) => (
                    <td key={c.label}>{c.render ? c.render(it) : it[c.key]}</td>
                  ))}
                  <td className="flex gap">
                    {"active" in it && (
                      <button className="link-btn" onClick={() => toggle(it)}>
                        {it.active ? "Disable" : "Enable"}
                      </button>
                    )}
                    <button className="link-btn" onClick={() => setEdit(it)}>
                      Edit
                    </button>
                    <button
                      className="link-btn"
                      style={{ color: "#b3261e" }}
                      onClick={() => remove(it)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td
                    colSpan={cfg.columns.length + (cfg.image ? 2 : 1)}
                    className="muted text-center"
                  >
                    Nothing here yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {pg.pages > 1 && (
            <Pagination page={pg.page} pages={pg.pages} onChange={setPage} />
          )}
        </div>
      )}

      {edit && (
        <Modal
          title={edit._id ? `Edit ${cfg.single}` : `New ${cfg.single}`}
          onClose={() => setEdit(null)}
        >
          <Form
            cfg={cfg}
            item={edit._id ? edit : null}
            onDone={() => {
              setEdit(null);
              reload();
            }}
            onCancel={() => setEdit(null)}
          />
        </Modal>
      )}
    </div>
  );
}

const active = (it) => (
  <span className={`status ${it.active ? "active" : "disabled"}`}>
    {it.active ? "Active" : "Disabled"}
  </span>
);

export const CONFIGS = {
  categories: {
    title: "Categories",
    single: "category",
    endpoint: "/admin/categories",
    folder: "categories",
    image: true,
    defaults: { active: true, sortOrder: 0 },
    columns: [
      { label: "Name", key: "name" },
      { label: "Slug", key: "slug" },
      { label: "Order", key: "sortOrder" },
      { label: "Status", render: active },
    ],
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "sortOrder", label: "Sort order", type: "number" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "image", label: "Image", type: "image" },
      { name: "active", label: "Active", type: "checkbox" },
    ],
  },
  collections: {
    title: "Collections",
    single: "collection",
    endpoint: "/admin/collections",
    folder: "collections",
    image: true,
    defaults: { active: true, sortOrder: 0 },
    columns: [
      { label: "Name", key: "name" },
      { label: "Slug", key: "slug" },
      { label: "Status", render: active },
    ],
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "sortOrder", label: "Sort order", type: "number" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "image", label: "Image", type: "image" },
      { name: "active", label: "Active", type: "checkbox" },
    ],
  },
  banners: {
    title: "Banners",
    single: "banner",
    endpoint: "/admin/banners",
    folder: "banners",
    image: true,
    defaults: {
      active: true,
      position: "hero",
      sortOrder: 0,
      ctaUrl: "/products",
    },
    columns: [
      { label: "Title", key: "title" },
      { label: "Position", key: "position" },
      {
        label: "Schedule",
        render: (b) =>
          b.startsAt || b.endsAt
            ? `${date(b.startsAt) || "…"} – ${date(b.endsAt) || "…"}`
            : "Always",
      },
      { label: "Status", render: active },
    ],
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "subtitle", label: "Subtitle" },
      {
        name: "position",
        label: "Position",
        type: "select",
        options: ["hero", "promo", "offer", "bulk", "store"],
      },
      { name: "sortOrder", label: "Sort order", type: "number" },
      { name: "ctaText", label: "Button text" },
      { name: "ctaUrl", label: "Button link (e.g. /products)" },
      { name: "startsAt", label: "Start date", type: "date" },
      { name: "endsAt", label: "End date", type: "date" },
      {
        name: "image",
        label: "Image (wide banner, about 1800×640 for hero)",
        type: "image",
      },
      { name: "active", label: "Active", type: "checkbox" },
    ],
  },
  coupons: {
    title: "Coupons",
    single: "coupon",
    endpoint: "/admin/coupons",
    folder: "coupons",
    defaults: {
      active: true,
      type: "percent",
      minOrder: 0,
      maxDiscount: 0,
      usageLimit: 0,
      perUserLimit: 0,
    },
    columns: [
      { label: "Code", render: (c) => <b>{c.code}</b> },
      {
        label: "Discount",
        render: (c) =>
          c.type === "percent" ? `${c.value}%` : `Rs. ${c.value}`,
      },
      { label: "Min order", key: "minOrder" },
      {
        label: "Used",
        render: (c) =>
          `${c.usedCount || 0}${c.usageLimit ? ` / ${c.usageLimit}` : ""}`,
      },
      { label: "Expires", render: (c) => date(c.expiresAt) || "Never" },
      { label: "Status", render: active },
    ],
    fields: [
      { name: "code", label: "Code", required: true },
      {
        name: "type",
        label: "Type",
        type: "select",
        options: ["percent", "fixed"],
      },
      {
        name: "value",
        label: "Value (% or Rs.)",
        type: "number",
        required: true,
      },
      { name: "minOrder", label: "Minimum order (Rs.)", type: "number" },
      {
        name: "maxDiscount",
        label: "Max discount (0 = no cap)",
        type: "number",
      },
      {
        name: "usageLimit",
        label: "Total usage limit (0 = unlimited)",
        type: "number",
      },
      {
        name: "perUserLimit",
        label: "Per customer limit (0 = unlimited)",
        type: "number",
      },
      { name: "startsAt", label: "Starts", type: "date" },
      { name: "expiresAt", label: "Expires", type: "date" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "active", label: "Active", type: "checkbox" },
    ],
  },
  blog: {
    title: "Blog & News",
    single: "post",
    endpoint: "/admin/blog",
    folder: "blog",
    image: true,
    defaults: {
      active: true,
      type: "blog",
      tag: "healthy lifestyle",
      author: "Admin",
    },
    columns: [
      { label: "Title", key: "title" },
      { label: "Type", key: "type" },
      { label: "Published", render: (p) => date(p.publishedAt) },
      { label: "Status", render: active },
    ],
    fields: [
      { name: "title", label: "Title", required: true },
      {
        name: "type",
        label: "Type",
        type: "select",
        options: ["blog", "news"],
      },
      { name: "tag", label: "Tag" },
      { name: "author", label: "Author" },
      { name: "excerpt", label: "Excerpt", type: "textarea" },
      {
        name: "content",
        label: "Content (blank line between paragraphs)",
        type: "textarea",
      },
      { name: "image", label: "Cover image", type: "image" },
      { name: "active", label: "Published", type: "checkbox" },
    ],
  },
};
