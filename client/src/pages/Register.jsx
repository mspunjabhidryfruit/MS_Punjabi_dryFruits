import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/auth.jsx";
import { Seo, Field } from "../components/Common.jsx";

const safeNext = (n) =>
  n && n.startsWith("/") && !n.startsWith("//") ? n : "/category/nuts";

export default function Register() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();

  const [f, setF] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to={safeNext(sp.get("next"))} replace />;
  }

  const set = (key) => (e) => {
    setF((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    const errors = {};

    if (f.name.trim().length < 2) {
      errors.name = "Enter your name";
    }

    if (!/^(\+91[\s-]?)?[6-9]\d{9}$/.test(f.phone.trim())) {
      errors.phone = "Enter a valid 10 digit mobile number";
    }

    if (
      f.password.length < 8 ||
      !/[A-Za-z]/.test(f.password) ||
      !/\d/.test(f.password)
    ) {
      errors.password = "At least 8 characters with a letter and a number";
    }

    if (f.password !== f.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setErrs(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setBusy(true);

    try {
      await register(f);

      toast.success("Account created. Welcome!");

      nav(safeNext(sp.get("next")), {
        replace: true,
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const getInputStyle = (hasError) => ({
    width: "100%",
    padding: "0.625rem 2.5rem 0.625rem 1rem",
    borderRadius: "8px",
    border: hasError ? "1px solid #ef4444" : "1px solid #d1d5db",
    backgroundColor: hasError ? "#fef2f2" : "#ffffff",
    fontSize: "0.875rem",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  });

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1rem",
        backgroundColor: "#fffdfa",
      }}
    >
      <Seo
        title="Create account"
        description="Create your MS Punjabi Dry Fruits account."
      />

      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: "#ffffff",
          border: "1px solid #fef3c7",
          borderRadius: "16px",
          boxShadow: "0 10px 25px -5px rgba(180, 83, 9, 0.08)",
          padding: "2rem",
        }}
      >
        {/* Header Icon & Branding */}
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
            Create account
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              marginTop: "0.25rem",
            }}
          >
            Join MS Punjabi Dry Fruits today
          </p>
        </div>

        <form
          onSubmit={submit}
          noValidate
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.125rem",
          }}
        >
          <Field label="Full name" id="rn" error={errs.name}>
            <input
              id="rn"
              placeholder="John Doe"
              autoComplete="name"
              value={f.name}
              onChange={set("name")}
              style={{
                ...getInputStyle(!!errs.name),
                paddingRight: "1rem",
              }}
            />
          </Field>

          <Field label="Email" id="re">
            <input
              id="re"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              value={f.email}
              onChange={set("email")}
              style={{
                ...getInputStyle(false),
                paddingRight: "1rem",
              }}
            />
          </Field>

          <Field label="Mobile number" id="rp" error={errs.phone}>
            <input
              id="rp"
              inputMode="tel"
              placeholder="9876543210"
              autoComplete="tel"
              value={f.phone}
              onChange={set("phone")}
              style={{
                ...getInputStyle(!!errs.phone),
                paddingRight: "1rem",
              }}
            />
          </Field>

          <Field label="Password" id="rpw" error={errs.password}>
            <div style={{ position: "relative", width: "100%" }}>
              <input
                id="rpw"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                value={f.password}
                onChange={set("password")}
                style={getInputStyle(!!errs.password)}
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
            {/* Helper Hint Text */}
            <span
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                marginTop: "0.25rem",
                display: "block",
              }}
            >
              At least 8 characters with a letter and a number
            </span>
          </Field>

          <Field label="Confirm password" id="rcp" error={errs.confirmPassword}>
            <div style={{ position: "relative", width: "100%" }}>
              <input
                id="rcp"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                value={f.confirmPassword}
                onChange={set("confirmPassword")}
                style={getInputStyle(!!errs.confirmPassword)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
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
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>

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
              marginTop: "0.5rem",
              transition: "background-color 0.15s ease",
            }}
          >
            {busy ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div
          style={{
            marginTop: "1.75rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid #f3f4f6",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "0.875rem", color: "#4b5563", margin: 0 }}>
            Already registered?{" "}
            <Link
              style={{
                color: "#d97706",
                fontWeight: "500",
                textDecoration: "none",
              }}
              to="/login"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
