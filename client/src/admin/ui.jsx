import { useState } from "react";
import toast from "react-hot-toast";
import { post } from "../services/api.js";
import { img } from "../utils/format.js";
import { useConfirm } from "../components/Common.jsx";

export function Modal({ title, onClose, children }) {
  return (
    <div
      className="modal-back"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-box"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className="flex between"
          style={{ marginBottom: 14, alignItems: "center" }}
        >
          <h2 style={{ fontSize: 24, color: "var(--ink)" }}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ImageUploader({
  value = [],
  onChange,
  multiple = true,
  folder = "products",
}) {
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();
  const pick = async (e) => {
    const files = [...e.target.files];
    e.target.value = "";
    if (!files.length) return;
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));
    setBusy(true);
    try {
      const r = await post(`/admin/upload?folder=${folder}`, fd);
      onChange(
        multiple ? [...value, ...r.data.images] : r.data.images.slice(0, 1),
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  const removeAt = async (i) => {
    const ok = await confirm({
      title: "Remove image",
      message: "Remove this image?",
      confirmText: "Remove",
    });
    if (!ok) return;
    onChange(value.filter((_, k) => k !== i));
    toast.success("Image removed");
  };
  return (
    <div className="thumbs">
      {value.map((im, i) => (
        <div className="t" key={im.url + i}>
          <img src={img(im.url, 200)} alt="" />
          <button
            type="button"
            onClick={() => removeAt(i)}
            aria-label="Remove image"
          >
            ×
          </button>
        </div>
      ))}
      {(multiple || !value.length) && (
        <label className="upload-btn">
          {busy ? "Uploading..." : "+ Upload"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple={multiple}
            hidden
            onChange={pick}
            disabled={busy}
          />
        </label>
      )}
    </div>
  );
}

export const PageHead = ({ title, children }) => (
  <div className="adm-top">
    <h1>{title}</h1>
    <div className="flex gap wrap">{children}</div>
  </div>
);
