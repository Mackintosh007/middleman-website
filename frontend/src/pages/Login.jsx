import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";
import SEO from "../components/SEO";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  /* ===============================
     LOGIN
  =============================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowResend(false);
    setResendMsg("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        "Invalid email or password";

      setError(msg);

      if (msg.toLowerCase().includes("verify")) {
        setShowResend(true);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     RESEND VERIFICATION
  =============================== */
  const resendVerification = async () => {
    try {
      setResendLoading(true);
      setResendMsg("");

      const res = await api.post(
        "/auth/resend-verification",
        { email }
      );

      setResendMsg(res.data.message);
    } catch (err) {
      setResendMsg(
        err.response?.data?.error ||
          "Failed to resend verification email"
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Login | Middleman"
        description="Login to your Middleman account"
        url="https://middlemanng.com/login"
      />

      <PageWrapper>
        <div className="max-w-md mx-auto bg-white p-6 rounded border">
          <h1 className="text-2xl font-bold mb-4">Login</h1>

          {error && (
            <p className="mb-3 text-red-600 text-sm">
              {error}
            </p>
          )}

          {showResend && (
            <div className="mb-4">
              <button
                type="button"
                onClick={resendVerification}
                disabled={resendLoading}
                className="text-sm text-blue-600 hover:underline"
              >
                {resendLoading
                  ? "Resending verification email..."
                  : "Resend verification email"}
              </button>

              {resendMsg && (
                <p className="text-sm mt-2 text-green-600">
                  {resendMsg}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              className="input w-full"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              className="input w-full"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="mt-4 text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}

export default Login;
