import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { get, put, del, download } from "../services/api.js";
import { useFetch, useDebounced } from "../utils/hooks.js";
import { inr, date, dateTime } from "../utils/format.js";
import {
  ErrorState,
  Skeleton,
  Pagination,
  Seo,
  Stars,
  useConfirm,
} from "../components/Common.jsx";
import { StatusPill } from "../pages/Account.jsx";
import { PageHead } from "./ui.jsx";

function useList(endpoint, extra = {}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const r = useFetch(
    () =>
      get(endpoint, { q: dq || undefined, page, limit: 20, ...extra }).then(
        (x) => ({ items: x.data.items, pg: x.pagination }),
      ),
    [endpoint, dq, page, JSON.stringify(extra)],
  );
  return {
    ...r,
    q,
    setQ: (v) => {
      setQ(v);
      setPage(1);
    },
    page,
    setPage,
  };
}
const Wrap = ({ title, list, children, search = true, head }) => (
  <div>
    <Seo title={`${title} (admin)`} description="Admin" />
    <PageHead title={title}>{head}</PageHead>
    {search && (
      <div className="toolbar">
        <input
          className="input"
          placeholder="Search"
          aria-label="Search"
          value={list.q}
          onChange={(e) => list.setQ(e.target.value)}
        />
      </div>
    )}
    {list.error ? (
      <ErrorState message={list.error} onRetry={list.reload} />
    ) : list.loading && !list.data ? (
      <Skeleton h={250} />
    ) : (
      <div className="adm-card tbl-wrap">
        {children}
        <Pagination
          page={list.data.pg.page}
          pages={list.data.pg.pages}
          onChange={list.setPage}
        />
      </div>
    )}
  </div>
);
const act = async (fn, list, ok) => {
  try {
    await fn();
    if (ok) toast.success(ok);
    list.reload();
  } catch (e) {
    toast.error(e.message);
  }
};

export function AdminCustomers() {
  const list = useList("/admin/customers");
  return (
    <Wrap title="Customers" list={list}>
      <table className="tbl">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Registered</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {list.data?.items.map((u) => (
            <tr key={u._id}>
              <td>
                <b>{u.name}</b>
              </td>
              <td>{u.email}</td>
              <td>{u.phone}</td>
              <td>{date(u.createdAt)}</td>
              <td>
                <span className={`status ${u.active ? "active" : "disabled"}`}>
                  {u.active ? "Active" : "Disabled"}
                </span>
              </td>
              <td>
                <Link className="link-btn" to={`/admin/customers/${u._id}`}>
                  View
                </Link>
              </td>
            </tr>
          ))}
          {!list.data?.items.length && (
            <tr>
              <td colSpan={6} className="muted">
                No customers yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Wrap>
  );
}

export function AdminCustomer() {
  const { id } = useParams();
  const confirm = useConfirm();
  const { data, loading, error, reload } = useFetch(
    () => get(`/admin/customers/${id}`).then((r) => r.data),
    [id],
  );
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !data) return <Skeleton h={300} />;
  const { user, orders, totalSpent } = data;
  return (
    <div>
      <PageHead title={user.name}>
        <Link to="/admin/customers" className="btn btn-outline btn-sm">
          ← Customers
        </Link>
        <button
          className="btn btn-outline btn-sm"
          onClick={async () => {
            const ok = await confirm({
              title: user.active ? "Disable account" : "Enable account",
              message: `${user.active ? "Disable" : "Enable"} this customer's account?`,
              confirmText: user.active ? "Disable" : "Enable",
            });
            if (!ok) return;
            put(`/admin/customers/${id}/toggle`)
              .then(() => {
                toast.success(
                  user.active ? "Customer disabled" : "Customer enabled",
                );
                reload();
              })
              .catch((e) => toast.error(e.message));
          }}
        >
          {user.active ? "Disable account" : "Enable account"}
        </button>
      </PageHead>
      <div className="stat-grid">
        <div className="stat">
          <small>Email</small>
          <b style={{ fontSize: 14 }}>{user.email}</b>
        </div>
        <div className="stat">
          <small>Phone</small>
          <b style={{ fontSize: 16 }}>{user.phone || "-"}</b>
        </div>
        <div className="stat">
          <small>Registered</small>
          <b style={{ fontSize: 16 }}>{date(user.createdAt)}</b>
        </div>
        <div className="stat">
          <small>Orders / spent</small>
          <b style={{ fontSize: 16 }}>
            {orders.length} · {inr(totalSpent)}
          </b>
        </div>
      </div>
      <div className="adm-card tbl-wrap">
        <b>Orders</b>
        <table className="tbl">
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td>
                  <Link className="link-btn" to={`/admin/orders/${o._id}`}>
                    {o.orderNumber}
                  </Link>
                </td>
                <td>{dateTime(o.createdAt)}</td>
                <td>{inr(o.grandTotal)}</td>
                <td>
                  <StatusPill s={o.paymentStatus} />
                </td>
                <td>
                  <StatusPill s={o.orderStatus} />
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan={5} className="muted">
                  No orders
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminReviews() {
  const [status, setStatus] = useState("");
  const confirm = useConfirm();
  const list = useList("/admin/reviews", { status: status || undefined });
  return (
    <Wrap
      title="Reviews"
      list={list}
      search={false}
      head={["", "pending", "approved", "rejected"].map((s) => (
        <button
          key={s}
          className={`chip ${status === s ? "on" : ""}`}
          onClick={() => {
            setStatus(s);
            list.setPage(1);
          }}
        >
          {s || "All"}
        </button>
      ))}
    >
      <table className="tbl">
        <thead>
          <tr>
            <th>Product</th>
            <th>Customer</th>
            <th>Rating</th>
            <th>Review</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {list.data?.items.map((r) => (
            <tr key={r._id}>
              <td>{r.product?.name}</td>
              <td>
                {r.name}
                <div className="muted" style={{ fontSize: 11 }}>
                  {date(r.createdAt)}
                </div>
              </td>
              <td>
                <Stars n={r.rating} />
              </td>
              <td style={{ maxWidth: 320 }}>{r.comment}</td>
              <td>
                <StatusPill s={r.status} />
              </td>
              <td className="flex gap">
                {r.status !== "approved" && (
                  <button
                    className="link-btn"
                    onClick={() =>
                      act(
                        () =>
                          put(`/admin/reviews/${r._id}`, {
                            status: "approved",
                          }),
                        list,
                        "Approved",
                      )
                    }
                  >
                    Approve
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button
                    className="link-btn"
                    onClick={() =>
                      act(
                        () =>
                          put(`/admin/reviews/${r._id}`, {
                            status: "rejected",
                          }),
                        list,
                        "Rejected",
                      )
                    }
                  >
                    Reject
                  </button>
                )}
                <button
                  className="link-btn"
                  style={{ color: "#b3261e" }}
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Delete review",
                      message: "Delete this review?",
                      confirmText: "Delete",
                    });
                    if (!ok) return;
                    act(() => del(`/admin/reviews/${r._id}`), list, "Deleted");
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {!list.data?.items.length && (
            <tr>
              <td colSpan={6} className="muted">
                No reviews
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Wrap>
  );
}

export function AdminMessages() {
  const [status, setStatus] = useState("");
  const confirm = useConfirm();
  const list = useList("/admin/messages", { status: status || undefined });
  return (
    <Wrap
      title="Contact messages"
      list={list}
      search={false}
      head={["", "new", "read", "resolved"].map((s) => (
        <button
          key={s}
          className={`chip ${status === s ? "on" : ""}`}
          onClick={() => {
            setStatus(s);
            list.setPage(1);
          }}
        >
          {s || "All"}
        </button>
      ))}
    >
      <table className="tbl">
        <thead>
          <tr>
            <th>From</th>
            <th>Message</th>
            <th>Date</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {list.data?.items.map((m) => (
            <tr key={m._id}>
              <td>
                <b>{m.name}</b>
                <div className="muted" style={{ fontSize: 11 }}>
                  {m.email}
                  <br />
                  {m.phone}
                </div>
              </td>
              <td style={{ maxWidth: 380 }}>{m.message}</td>
              <td>{dateTime(m.createdAt)}</td>
              <td>
                <select
                  className="select"
                  style={{ width: 120 }}
                  aria-label="Status"
                  value={m.status}
                  onChange={(e) =>
                    act(
                      () =>
                        put(`/admin/messages/${m._id}`, {
                          status: e.target.value,
                        }),
                      list,
                    )
                  }
                >
                  {["new", "read", "resolved"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td>
                <button
                  className="link-btn"
                  style={{ color: "#b3261e" }}
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Delete message",
                      message: "Delete this message?",
                      confirmText: "Delete",
                    });
                    if (!ok) return;
                    act(() => del(`/admin/messages/${m._id}`), list, "Deleted");
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {!list.data?.items.length && (
            <tr>
              <td colSpan={5} className="muted">
                No messages
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Wrap>
  );
}

export function AdminNewsletter() {
  const confirm = useConfirm();
  const list = useList("/admin/newsletter");
  return (
    <Wrap
      title="Newsletter subscribers"
      list={list}
      head={
        <button
          className="btn btn-yellow btn-sm"
          onClick={() =>
            download(
              "/admin/newsletter/export",
              "newsletter-subscribers.csv",
            ).catch((e) => toast.error(e.message))
          }
        >
          Export CSV
        </button>
      }
    >
      <table className="tbl">
        <thead>
          <tr>
            <th>Email</th>
            <th>Subscribed</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {list.data?.items.map((s) => (
            <tr key={s._id}>
              <td>{s.email}</td>
              <td>{date(s.createdAt)}</td>
              <td>
                <span className={`status ${s.active ? "active" : "disabled"}`}>
                  {s.active ? "Active" : "Disabled"}
                </span>
              </td>
              <td>
                <div className="flex gap">
                  <button
                    className="link-btn"
                    onClick={() =>
                      act(() =>
                        put(
                          `/admin/newsletter/${s._id}/toggle`,
                          list,
                          s.active
                            ? "Subscriber disabled"
                            : "Subscriber enabled",
                        ),
                      )
                    }
                  >
                    {s.active ? "Disable" : "Enable"}
                  </button>

                  <button
                    className="link-btn"
                    style={{ color: "#b3261e" }}
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Delete subscriber",
                        message: "Delete this subscriber?",
                        confirmText: "Delete",
                      });
                      if (!ok) return;
                      act(() =>
                        del(`/admin/newsletter/${s._id}`, list, "Deleted"),
                      );
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!list.data?.items.length && (
            <tr>
              <td colSpan={4} className="muted">
                No subscribers
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Wrap>
  );
}
