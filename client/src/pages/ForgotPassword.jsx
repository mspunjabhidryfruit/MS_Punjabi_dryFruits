import { useState } from "react";
import { Link } from "react-router-dom";
import { post } from "../services/api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const res = await post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      setMessage(
        res.data?.message ||
          "If an account exists with that email, a password reset link has been sent.",
      );
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "65vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "70px 20px",
        background:
          "linear-gradient(180deg, #fffdf8 0%, #fffaf1 50%, #fdf6ea 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#ffffff",
          border: "1px solid #ead8c2",
          borderRadius: "22px",
          padding: "42px 40px",
          boxShadow: "0 18px 50px rgba(101, 58, 25, 0.10)",
          boxSizing: "border-box",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 22px",
            borderRadius: "50%",
            background: "#f8eadb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9a4625",
            fontSize: "28px",
          }}
        >
          🔐
        </div>

        {/* Heading */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              color: "#9a4625",
              fontSize: "12px",
              fontWeight: "600",
              letterSpacing: "3px",
              textTransform: "uppercase",
            }}
          >
            Account Recovery
          </p>

          <h1
            style={{
              margin: "0",
              color: "#174d25",
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "34px",
              lineHeight: "1.2",
              fontWeight: "600",
            }}
          >
            Forgot Password?
          </h1>

          <p
            style={{
              margin: "14px auto 0",
              maxWidth: "380px",
              color: "#665b52",
              fontSize: "15px",
              lineHeight: "1.7",
            }}
          >
            Enter your registered email address and we'll send you a secure link
            to reset your password.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <label
            htmlFor="forgot-email"
            style={{
              color: "#3d3028",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            Email Address
          </label>

          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            autoComplete="email"
            disabled={loading}
            style={{
              width: "100%",
              height: "52px",
              boxSizing: "border-box",
              padding: "0 16px",
              border: "1px solid #dbc8b5",
              borderRadius: "10px",
              outline: "none",
              background: "#fffdfa",
              color: "#302820",
              fontSize: "15px",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#a34b27";
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(163, 75, 39, 0.10)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#dbc8b5";
              e.currentTarget.style.boxShadow = "none";
            }}
          />

          {/* Error */}
          {error && (
            <div
              style={{
                marginTop: "5px",
                padding: "11px 13px",
                borderRadius: "9px",
                background: "#fff1f0",
                border: "1px solid #f2c7c3",
                color: "#b42318",
                fontSize: "13px",
                lineHeight: "1.5",
              }}
            >
              {error}
            </div>
          )}

          {/* Success */}
          {message && (
            <div
              style={{
                marginTop: "5px",
                padding: "12px 14px",
                borderRadius: "9px",
                background: "#eff8ef",
                border: "1px solid #c8e3ca",
                color: "#216b2b",
                fontSize: "13px",
                lineHeight: "1.5",
              }}
            >
              {message}
            </div>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "52px",
              marginTop: "12px",
              border: "none",
              borderRadius: "10px",
              background: loading ? "#b97859" : "#963f20",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: "600",
              letterSpacing: "0.3px",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 7px 18px rgba(150, 63, 32, 0.18)",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#7f3219";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = loading
                ? "#b97859"
                : "#963f20";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? "Sending Reset Link..." : "Send Reset Link"}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "28px 0 20px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "#eadfd4",
            }}
          />

          <span
            style={{
              color: "#a2958a",
              fontSize: "12px",
            }}
          >
            or
          </span>

          <div
            style={{
              flex: 1,
              height: "1px",
              background: "#eadfd4",
            }}
          />
        </div>

        {/* Back */}
        <div
          style={{
            textAlign: "center",
          }}
        >
          <Link
            to="/login"
            style={{
              color: "#8f4325",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
