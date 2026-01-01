import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <PageWrapper>
        <p className="text-red-600">
          Invalid or missing reset token.
        </p>
      </PageWrapper>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    if (password !== confirm) {
      return setError("Passwords do not match.");
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        token,
        password
      });

      setSuccess("Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Reset failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-md mx-auto bg-white p-6 rounded border">
        <h1 className="text-2xl font-bold mb-4">
          Reset Password
        </h1>

        {error && (
          <p className="mb-3 text-red-600 text-sm">
            {error}
          </p>
        )}

        {success && (
          <p className="mb-3 text-green-600 text-sm">
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            className="input w-full"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            className="input w-full"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </PageWrapper>
  );
}

export default ResetPassword;
