import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageWrapper from "../components/PageWrapper";
import SEO from "../components/SEO";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ✅ SEO (SAFE, NON-BREAKING) */}
      <SEO
        title="Login | Middleman"
        description="Login to your Middleman account to buy and sell securely with escrow protection."
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

          {/* ✅ FORGOT PASSWORD (UI ONLY) */}
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
