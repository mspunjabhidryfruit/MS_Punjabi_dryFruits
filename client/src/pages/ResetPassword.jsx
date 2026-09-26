import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { post } from "../services/api.js";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!token) {
      setError("Invalid password reset link.");
      return;
    }

    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post(`/auth/reset-password/${token}`, {
        password,
      });

      setMessage(
        res.data?.data?.message ||
          "Password reset successfully. You can now sign in.",
      );

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "This password reset link is invalid or has expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <h1>Reset Password</h1>

          <p>Enter a new password for your MS Punjabi Dry Fruits account.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="new-password">New Password</label>

          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            autoComplete="new-password"
            disabled={loading}
          />

          <label htmlFor="confirm-password">Confirm Password</label>

          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            disabled={loading}
          />

          {error && <div className="auth-error">{error}</div>}

          {message && <div className="auth-success">{message}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </main>
  );
}
