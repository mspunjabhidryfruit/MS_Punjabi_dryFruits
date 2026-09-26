import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/auth.jsx";
import { Seo, Field } from "../components/Common.jsx";

const safeNext = (n) =>
  n && n.startsWith("/") && !n.startsWith("//") ? n : "/account";

export default function Login() {
  const { user, login, isAdmin } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [f, setF] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user) {
    return (
      <Navigate
        to={
          sp.get("next")
            ? safeNext(sp.get("next"))
            : isAdmin
              ? "/admin"
              : "/account"
        }
        replace
      />
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);

    try {
      const u = await login(f);

      toast.success(`Welcome back, ${u.name.split(" ")[0]}!`);

      const admin = ["admin", "superadmin"].includes(u.role);

      nav(
        sp.get("next")
          ? safeNext(sp.get("next"))
          : admin
            ? "/admin"
            : "/account",
        { replace: true },
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1rem",
        backgroundColor: "#fffdfa",
      }}
    >
      <Seo
        title="Sign in"
        description="Sign in to your MS Punjabi Dry Fruits account."
      />

      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#ffffff",
          border: "1px solid #fef3c7",
          borderRadius: "16px",
          boxShadow: "0 10px 25px -5px rgba(180, 83, 9, 0.08)",
          padding: "2rem",
        }}
      >
        {/* Brand Accent Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              backgroundColor: "#fef3c7",
              marginBottom: "0.75rem",
              overflow: "hidden",
            }}
          >
            <img
              src="/img/logo.jpg"
              alt="MS Punjabi Dry Fruits"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </div>
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: "700",
              color: "#111827",
              margin: 0,
            }}
          >
            Sign in
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              marginTop: "0.25rem",
            }}
          >
            Access your MS Punjabi Dry Fruits account
          </p>
        </div>

        <form
          onSubmit={submit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          <Field label="Email" id="le">
            <input
              id="le"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
              style={{
                width: "100%",
                padding: "0.625rem 1rem",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "0.875rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </Field>

          <Field label="Password" id="lp">
            <div style={{ position: "relative", width: "100%" }}>
              <input
                id="lp"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                value={f.password}
                onChange={(e) => setF({ ...f, password: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.625rem 2.5rem 0.625rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontSize: "0.875rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  color: "#6b7280",
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "-0.5rem",
            }}
          >
            <Link
              to="/forgot-password"
              style={{
                color: "#d97706",
                fontSize: "0.8125rem",
                fontWeight: "500",
                textDecoration: "none",
              }}
            >
              Forgot Password?
            </Link>
          </div>

          <button
            disabled={busy}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              backgroundColor: "#f59e0b",
              color: "#ffffff",
              fontWeight: "600",
              border: "none",
              borderRadius: "8px",
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.7 : 1,
              fontSize: "0.875rem",
              transition: "background-color 0.15s ease",
            }}
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div
          style={{
            marginTop: "2rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid #f3f4f6",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "0.875rem", color: "#4b5563", margin: 0 }}>
            New here?{" "}
            <Link
              style={{
                color: "#d97706",
                fontWeight: "500",
                textDecoration: "none",
              }}
              to={`/register${
                sp.get("next")
                  ? `?next=${encodeURIComponent(sp.get("next"))}`
                  : ""
              }`}
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
