import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { get, post, ADMIN_KEY } from "../services/api.js";
import { Seo, Field } from "../components/Common.jsx";
import "../styles/admin.css";

const Ctx = createContext(null);
export const useAdmin = () => useContext(Ctx);

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [ready, setReady] = useState(!localStorage.getItem(ADMIN_KEY));
  const logout = () => {
    const shared =
      localStorage.getItem("msp_token") === localStorage.getItem(ADMIN_KEY);
    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem("msp_admin_name");
    setAdmin(null);
    // an admin who signed in through the storefront shares one session: end it everywhere
    if (shared)
      window.dispatchEvent(
        new CustomEvent("msp:unauthorized", { detail: { admin: false } }),
      );
  };
  useEffect(() => {
    if (!localStorage.getItem(ADMIN_KEY)) return;
    // validate the admin token through an admin-only endpoint
    get("/admin/settings")
      .then(() => {
        const payload = JSON.parse(
          atob(localStorage.getItem(ADMIN_KEY).split(".")[1]),
        );
        setAdmin({
          id: payload.id,
          role: payload.role,
          name: localStorage.getItem("msp_admin_name") || "Admin",
        });
      })
      .catch(() => logout())
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    const h = (e) => {
      if (e.detail?.admin) {
        logout();
        toast.error("Session expired. Please sign in again.");
      }
    };
    window.addEventListener("msp:unauthorized", h);
    return () => window.removeEventListener("msp:unauthorized", h);
  }, []);
  const login = async (body) => {
    const r = await post("/auth/admin/login", body);
    localStorage.setItem(ADMIN_KEY, r.data.token);
    localStorage.setItem("msp_admin_name", r.data.user.name);
    setAdmin({
      id: r.data.user._id,
      role: r.data.user.role,
      name: r.data.user.name,
    });
  };
  return (
    <Ctx.Provider value={{ admin, ready, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function RequireAdmin({ children }) {
  const { admin, ready } = useAdmin();
  const loc = useLocation();
  if (!ready) return <div className="empty">Loading...</div>;
  if (!admin)
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return children;
}

export function AdminLogin() {
  const { admin, login } = useAdmin();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  if (admin) return <Navigate to={loc.state?.from || "/admin"} replace />;
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(f);
      nav(loc.state?.from || "/admin", { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="adm-login">
      <Seo title="Admin sign in" description="Admin" />
      <form
        className="card form-stack"
        style={{ width: 380, maxWidth: "100%" }}
        onSubmit={submit}
      >
        <img
          src="/img/logo.jpg"
          alt=""
          width="64"
          height="64"
          style={{ borderRadius: "50%", margin: "0 auto" }}
        />
        <h1 style={{ fontSize: 28, textAlign: "center" }}>Admin sign in</h1>
        <Field label="Email" id="ae">
          <input
            id="ae"
            className="input"
            type="email"
            required
            autoComplete="username"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
          />
        </Field>
        <Field label="Password" id="ap">
          <input
            id="ap"
            className="input"
            type="password"
            required
            autoComplete="current-password"
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
          />
        </Field>
        <button className="btn btn-yellow btn-block" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
