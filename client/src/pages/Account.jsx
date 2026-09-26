import { useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  useNavigate,
  useParams,
} from "react-router-dom";
import toast from "react-hot-toast";
import { get, post, download } from "../services/api.js";
import { useFetch } from "../utils/hooks.js";
import { useAuth } from "../context/auth.jsx";
import { useCart } from "../context/cart.jsx";
import { img, inr, date, dateTime, STATUSES } from "../utils/format.js";
import {
  Seo,
  Field,
  Empty,
  ErrorState,
  Skeleton,
  Pagination,
  useConfirm,
} from "../components/Common.jsx";
import { ProductCard } from "../components/ProductCard.jsx";
import { addr } from "./OrderConfirmation.jsx";

export function AccountLayout() {
  const { user, ready } = useAuth();
  if (!ready)
    return (
      <div className="container page">
        <Skeleton h={300} />
      </div>
    );
  if (!user) return <Navigate to="/login?next=/account" replace />;
  return (
    <div className="container page">
      <h1>My Account</h1>
      <div className="flex gap wrap" style={{ marginBottom: 22 }}>
        {[
          ["/account", "Profile", true],
          ["/account/orders", "Orders"],
          ["/account/wishlist", "Wishlist"],
        ].map(([to, l, end]) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `chip ${isActive ? "on" : ""}`}
          >
            {l}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}

export function Profile() {
  const { user, updateProfile, logout, isAdmin } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({
    name: user.name,
    phone: user.phone || "",
    currentPassword: "",
    newPassword: "",
  });
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const body = {
      name: f.name,
      phone: f.phone,
      ...(f.newPassword
        ? { currentPassword: f.currentPassword, newPassword: f.newPassword }
        : {}),
    };
    try {
      await updateProfile(body);
      toast.success("Profile updated");
      setF({ ...f, currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div style={{ maxWidth: 520 }}>
      <Seo title="My Account" description="Manage your profile." />
      {isAdmin && (
        <div
          className="card"
          style={{
            marginBottom: 16,
            background: "var(--cream)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <b>You are signed in as {user.role}</b>
            <div className="muted" style={{ fontSize: 12 }}>
              Manage products, orders, customers and site content.
            </div>
          </div>
          <Link className="btn btn-brown btn-sm" to="/admin">
            Open Admin Panel
          </Link>
        </div>
      )}
      <div className="card">
        <form className="form-stack" onSubmit={save}>
          <Field label="Name" id="pn">
            <input
              id="pn"
              className="input"
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
              required
              minLength={2}
            />
          </Field>
          <Field label="Email" id="pe">
            <input id="pe" className="input" value={user.email} readOnly />
          </Field>
          <Field label="Mobile" id="pp">
            <input
              id="pp"
              className="input"
              value={f.phone}
              onChange={(e) => setF({ ...f, phone: e.target.value })}
            />
          </Field>
          <b style={{ marginTop: 6 }}>Change password</b>
          <Field label="Current password" id="cp">
            <input
              id="cp"
              type="password"
              className="input"
              value={f.currentPassword}
              onChange={(e) => setF({ ...f, currentPassword: e.target.value })}
              autoComplete="current-password"
            />
          </Field>
          <Field label="New password (min 8, with a letter and number)" id="np">
            <input
              id="np"
              type="password"
              className="input"
              value={f.newPassword}
              onChange={(e) => setF({ ...f, newPassword: e.target.value })}
              autoComplete="new-password"
            />
          </Field>
          <div className="flex gap">
            <button className="btn btn-yellow" disabled={busy}>
              {busy ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                logout();
                nav("/");
              }}
            >
              Sign out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const StatusPill = ({ s }) => <span className={`status ${s}`}>{s}</span>;

export function Orders() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(
    () =>
      get("/orders", { page, limit: 8 }).then((r) => ({
        items: r.data.items,
        pg: r.pagination,
      })),
    [page],
  );
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !data) return <Skeleton h={200} />;
  if (!data.items.length)
    return (
      <Empty
        title="No orders yet"
        action={
          <Link className="btn btn-yellow" to="/products">
            Start shopping
          </Link>
        }
      >
        Your orders will appear here.
      </Empty>
    );
  return (
    <div>
      <Seo title="My Orders" description="Your order history." />
      <div className="card tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.items.map((o) => (
              <tr key={o._id}>
                <td>
                  <b>{o.orderNumber}</b>
                </td>
                <td>{date(o.createdAt)}</td>
                <td>
                  {o.items
                    .map((i) => `${i.name} ×${i.quantity}`)
                    .join(", ")
                    .slice(0, 60)}
                </td>
                <td>{inr(o.grandTotal)}</td>
                <td>
                  <StatusPill s={o.paymentStatus} />
                </td>
                <td>
                  <StatusPill s={o.orderStatus} />
                </td>
                <td>
                  <Link
                    className="link-btn"
                    to={`/account/orders/${o.orderNumber}`}
                  >
                    View details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={data.pg.page}
        pages={data.pg.pages}
        onChange={setPage}
      />
    </div>
  );
}

export function OrderDetail() {
  const { orderNumber } = useParams();
  const confirm = useConfirm();
  const { data, loading, error, reload } = useFetch(
    () => get(`/orders/${orderNumber}`).then((r) => r.data.order),
    [orderNumber],
  );
  const [busy, setBusy] = useState(false);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <Skeleton h={300} />;
  const o = data;
  const cancel = async () => {
    const ok = await confirm({
      title: "Cancel order",
      message: "Cancel this order?",
      confirmText: "Cancel order",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await post(`/orders/${o.orderNumber}/cancel`);
      toast.success("Order cancelled");
      reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  const flow = STATUSES.filter((s) => s !== "Cancelled");
  return (
    <div>
      <Seo title={`Order ${o.orderNumber}`} description="Order details" />
      <div
        className="flex between wrap gap"
        style={{ alignItems: "center", marginBottom: 16 }}
      >
        <div>
          <h2 style={{ fontSize: 28 }}>Order {o.orderNumber}</h2>
          <span className="muted">Placed on {dateTime(o.createdAt)}</span>
        </div>
        <div className="flex gap wrap">
          <button
            className="btn btn-outline btn-sm"
            onClick={() =>
              download(
                `/orders/${o.orderNumber}/invoice`,
                `MS-Punjabi-Dry-Fruits-${o.orderNumber}.pdf`,
              ).catch((e) => toast.error(e.message))
            }
          >
            Download invoice
          </button>
          {["Pending", "Confirmed"].includes(o.orderStatus) && (
            <button
              className="btn btn-outline btn-sm"
              onClick={cancel}
              disabled={busy}
            >
              Cancel order
            </button>
          )}
        </div>
      </div>
      <div className="two-col">
        <div className="form-stack">
          <div className="card">
            <h3 style={{ marginBottom: 8 }}>Items</h3>
            {o.items.map((i) => (
              <div className="mini-item" key={i.variantId}>
                <img src={img(i.image, 120)} alt="" />
                <div style={{ flex: 1 }}>
                  <Link to={`/products/${i.slug}`}>
                    <b>{i.name}</b>
                  </Link>
                  <div className="muted" style={{ fontSize: 11 }}>
                    {i.weight} × {i.quantity} · {inr(i.unitPrice)}
                    {i.originalPrice > i.unitPrice && (
                      <>
                        {" "}
                        <s>{inr(i.originalPrice)}</s>
                      </>
                    )}
                  </div>
                  {o.orderStatus === "Delivered" && (
                    <Link
                      className="link-btn"
                      style={{ fontSize: 11 }}
                      to={`/products/${i.slug}#reviews`}
                    >
                      Write a review
                    </Link>
                  )}
                </div>
                <b>{inr(i.lineTotal)}</b>
              </div>
            ))}
            <div className="mt">
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
                <span>{o.deliveryCharge ? inr(o.deliveryCharge) : "Free"}</span>
              </div>
              {o.tax > 0 && (
                <div className="sum-line">
                  <span>Tax</span>
                  <span>{inr(o.tax)}</span>
                </div>
              )}
              <div className="sum-line total">
                <span>Grand total</span>
                <span>{inr(o.grandTotal)}</span>
              </div>
            </div>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 8 }}>Shipping address</h3>
            <p style={{ margin: 0, fontSize: 13 }}>{addr(o.shippingAddress)}</p>
          </div>
        </div>
        <div className="form-stack">
          <div className="card">
            <div className="sum-line">
              <span>Status</span>
              <StatusPill s={o.orderStatus} />
            </div>
            <div className="sum-line">
              <span>Payment</span>
              <span>
                {o.paymentMethod === "COD" ? "Cash on Delivery" : "Razorpay"}{" "}
                <StatusPill s={o.paymentStatus} />
              </span>
            </div>
            {o.estimatedDelivery &&
              o.orderStatus !== "Cancelled" &&
              o.orderStatus !== "Delivered" && (
                <div className="sum-line">
                  <span>Estimated delivery</span>
                  <span>{date(o.estimatedDelivery)}</span>
                </div>
              )}
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Order timeline</h3>
            <ul className="timeline">
              {[...o.statusHistory].reverse().map((h, i) => (
                <li key={i}>
                  <b>{h.status}</b>
                  <div className="muted" style={{ fontSize: 11 }}>
                    {dateTime(h.at)}
                    {h.note ? ` · ${h.note}` : ""}
                  </div>
                </li>
              ))}
            </ul>
            {o.orderStatus !== "Cancelled" && o.orderStatus !== "Delivered" && (
              <div className="muted" style={{ fontSize: 11 }}>
                Next: {flow[flow.indexOf(o.orderStatus) + 1]}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Wishlist() {
  const { wishIds, add } = useCart();
  const { data, loading, error, reload } = useFetch(
    () => get("/wishlist").then((r) => r.data.items),
    [wishIds.length],
  );
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !data) return <Skeleton h={200} />;
  if (!data?.length)
    return (
      <Empty
        title="Your wishlist is empty"
        action={
          <Link className="btn btn-yellow" to="/products">
            Browse products
          </Link>
        }
      >
        Tap the heart on any product to save it here.
      </Empty>
    );
  return (
    <div>
      <Seo title="Wishlist" description="Your saved products." />
      <div className="grid-products">
        {data.map((p) => (
          <div key={p._id}>
            <ProductCard p={p} />
            <button
              className="link-btn"
              style={{ fontSize: 11, marginTop: 6 }}
              onClick={() => {
                const v = p.variants.find((x) => x.stock > 0);
                if (v) add(p._id, v._id);
                else toast.error("Out of stock");
              }}
            >
              Move to cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
