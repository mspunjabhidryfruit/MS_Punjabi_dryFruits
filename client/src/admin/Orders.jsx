import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { get, put, post, download } from "../services/api.js";
import api from "../services/api.js";
import { useFetch, useDebounced } from "../utils/hooks.js";
import { img, inr, dateTime, STATUSES } from "../utils/format.js";
import {
  ErrorState,
  Skeleton,
  Pagination,
  Seo,
  useConfirm,
} from "../components/Common.jsx";
import { StatusPill } from "../pages/Account.jsx";
import { PageHead } from "./ui.jsx";
import { addr } from "../pages/OrderConfirmation.jsx";

const NEXT = {
  Pending: ["Confirmed", "Processing", "Cancelled"],
  Confirmed: ["Processing", "Shipped", "Cancelled"],
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Out for Delivery", "Delivered", "Cancelled"],
  "Out for Delivery": ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
};

export function AdminOrders() {
  const [f, setF] = useState({
    q: "",
    status: "",
    payment: "",
    method: "",
    from: "",
    to: "",
  });
  const [page, setPage] = useState(1);
  const dq = useDebounced(f.q);
  const params = { ...f, q: dq || undefined, page, limit: 15 };
  Object.keys(params).forEach((k) => params[k] === "" && delete params[k]);
  const { data, loading, error, reload } = useFetch(
    () =>
      get("/admin/orders", params).then((r) => ({
        items: r.data.items,
        pg: r.pagination,
      })),
    [JSON.stringify(params)],
  );
  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value });
    setPage(1);
  };
  return (
    <div>
      <Seo title="Orders (admin)" description="Admin" />
      <PageHead title="Orders" />
      <div className="toolbar">
        <input
          className="input"
          placeholder="Search order, name, phone, email"
          aria-label="Search orders"
          value={f.q}
          onChange={set("q")}
          style={{ minWidth: 260 }}
        />
        <select
          className="select"
          aria-label="Status"
          value={f.status}
          onChange={set("status")}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          className="select"
          aria-label="Payment status"
          value={f.payment}
          onChange={set("payment")}
        >
          <option value="">All payments</option>
          {["Pending", "Paid", "Failed", "Refunded"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          className="select"
          aria-label="Payment method"
          value={f.method}
          onChange={set("method")}
        >
          <option value="">COD + Online</option>
          <option value="COD">COD</option>
          <option value="Razorpay">Razorpay</option>
        </select>
        <input
          type="date"
          className="input"
          aria-label="From"
          value={f.from}
          onChange={set("from")}
        />
        <input
          type="date"
          className="input"
          aria-label="To"
          value={f.to}
          onChange={set("to")}
        />
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
                <th>Order</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Method</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((o) => (
                <tr key={o._id}>
                  <td>
                    <Link className="link-btn" to={`/admin/orders/${o._id}`}>
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td>{dateTime(o.createdAt)}</td>
                  <td>
                    {o.customer?.name}
                    <div className="muted" style={{ fontSize: 11 }}>
                      {o.customer?.phone}
                    </div>
                  </td>
                  <td>{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td>{inr(o.grandTotal)}</td>
                  <td>{o.paymentMethod}</td>
                  <td>
                    <StatusPill s={o.paymentStatus} />
                  </td>
                  <td>
                    <StatusPill s={o.orderStatus} />
                  </td>
                </tr>
              ))}
              {!data.items.length && (
                <tr>
                  <td colSpan={8} className="muted">
                    No orders match these filters
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

export function AdminOrderDetail() {
  const { id } = useParams();
  const confirm = useConfirm();
  const {
    data: o,
    loading,
    error,
    reload,
  } = useFetch(
    () => get(`/admin/orders/${id}`).then((r) => r.data.order),
    [id],
  );
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !o) return <Skeleton h={400} />;
  const opts = NEXT[o.orderStatus] || [];
  const run = async (fn, ok) => {
    setBusy(true);
    try {
      await fn();
      if (ok) toast.success(ok);
      reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  const printInvoice = async () => {
    try {
      const r = await api.get(`/admin/orders/${o._id}/invoice`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(r.data);
      const w = window.open(url);
      if (w) w.addEventListener("load", () => w.print());
    } catch (e) {
      toast.error(e.message);
    }
  };
  return (
    <div>
      <Seo title={`Order ${o.orderNumber}`} description="Admin" />
      <PageHead title={`Order ${o.orderNumber}`}>
        <Link to="/admin/orders" className="btn btn-outline btn-sm">
          ← All orders
        </Link>
      </PageHead>
      <div className="adm-grid-3">
        <div className="form-stack">
          <div className="adm-card">
            <b>Customer</b>
            <p style={{ margin: "6px 0 0", fontSize: 13 }}>
              {o.customer.name}
              <br />
              {o.customer.email}
              <br />
              {o.customer.phone}
              {o.user?._id && (
                <>
                  <br />
                  <Link
                    className="link-btn"
                    to={`/admin/customers/${o.user._id}`}
                  >
                    View customer
                  </Link>
                </>
              )}
            </p>
          </div>
          <div className="adm-card">
            <b>Shipping address</b>
            <p style={{ margin: "6px 0 0", fontSize: 13 }}>
              {addr(o.shippingAddress)}
            </p>
            {o.notes && (
              <p className="muted" style={{ fontSize: 12 }}>
                Note: {o.notes}
              </p>
            )}
          </div>
          <div className="adm-card">
            <b>Products</b>
            {o.items.map((i) => (
              <div className="mini-item" key={i.variantId}>
                <img src={img(i.image, 120)} alt="" />
                <div style={{ flex: 1 }}>
                  {i.name}
                  <div className="muted" style={{ fontSize: 11 }}>
                    {i.weight} × {i.quantity} · {inr(i.unitPrice)} (MRP{" "}
                    {inr(i.originalPrice)})
                  </div>
                </div>
                <b>{inr(i.lineTotal)}</b>
              </div>
            ))}
          </div>
          <div className="adm-card">
            <b>Timeline</b>
            <ul className="timeline" style={{ marginTop: 12 }}>
              {[...o.statusHistory].reverse().map((h, i) => (
                <li key={i}>
                  <b>{h.status}</b>
                  <div className="muted" style={{ fontSize: 11 }}>
                    {dateTime(h.at)} · {h.by}
                    {h.note ? ` · ${h.note}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="form-stack">
          <div className="adm-card">
            <div className="sum-line">
              <span>Status</span>
              <StatusPill s={o.orderStatus} />
            </div>
            <div className="sum-line">
              <span>Payment</span>
              <span>
                {o.paymentMethod} <StatusPill s={o.paymentStatus} />
              </span>
            </div>
            {o.payment?.razorpayPaymentId && (
              <div className="sum-line">
                <span>Razorpay ID</span>
                <span style={{ fontSize: 11 }}>
                  {o.payment.razorpayPaymentId}
                </span>
              </div>
            )}
            <hr style={{ border: 0, borderTop: "1px solid var(--line-2)" }} />
            <div className="sum-line">
              <span>Subtotal</span>
              <span>{inr(o.subtotal)}</span>
            </div>
            {o.discount > 0 && (
              <div className="sum-line">
                <span>Coupon ({o.coupon?.code})</span>
                <span>- {inr(o.discount)}</span>
              </div>
            )}
            <div className="sum-line">
              <span>Delivery</span>
              <span>{inr(o.deliveryCharge)}</span>
            </div>
            <div className="sum-line">
              <span>Tax</span>
              <span>{inr(o.tax)}</span>
            </div>
            <div className="sum-line total">
              <span>Total</span>
              <span>{inr(o.grandTotal)}</span>
            </div>
          </div>
          <div className="adm-card form-stack">
            <b>Update status</b>
            {opts.length ? (
              <>
                <select
                  className="select"
                  aria-label="New status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">Choose next status</option>
                  {opts.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <input
                  className="input"
                  placeholder="Note (optional)"
                  aria-label="Note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={300}
                />
                <button
                  className="btn btn-yellow btn-sm"
                  disabled={!status || busy}
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Update order status",
                      message: `Change order status to "${status}"? The customer will be notified by email.`,
                      confirmText: "Update",
                    });
                    if (!ok) return;
                    run(
                      () =>
                        put(`/admin/orders/${o._id}/status`, {
                          status,
                          note,
                        }).then(() => {
                          setStatus("");
                          setNote("");
                        }),
                      "Status updated. Customer notified by email.",
                    );
                  }}
                >
                  Update status
                </button>
              </>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                This order is {o.orderStatus.toLowerCase()} and can no longer
                change.
              </p>
            )}
            <select
              className="select"
              aria-label="Payment status"
              value={o.paymentStatus}
              onChange={async (e) => {
                const v = e.target.value;
                const ok = await confirm({
                  title: "Update payment status",
                  message: `Change payment status to "${v}"?`,
                  confirmText: "Update",
                });
                if (!ok) return;
                run(
                  () =>
                    put(`/admin/orders/${o._id}/payment`, { paymentStatus: v }),
                  "Payment status updated",
                );
              }}
            >
              {["Pending", "Paid", "Failed", "Refunded"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="adm-card form-stack">
            <b>Actions</b>
            <button
              className="btn btn-outline btn-sm"
              onClick={() =>
                download(
                  `/admin/orders/${o._id}/invoice`,
                  `MS-Punjabi-Dry-Fruits-${o.orderNumber}.pdf`,
                ).catch((e) => toast.error(e.message))
              }
            >
              Download invoice
            </button>
            <button className="btn btn-outline btn-sm" onClick={printInvoice}>
              Print invoice
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() =>
                download(
                  `/admin/orders/${o._id}/shipping`,
                  `Shipping-${o.orderNumber}.pdf`,
                ).catch((e) => toast.error(e.message))
              }
            >
              Download shipping address
            </button>
            <button
              className="btn btn-outline btn-sm"
              disabled={busy}
              onClick={() =>
                run(() => post(`/admin/orders/${o._id}/notify`), "Email sent")
              }
            >
              Send notification email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
