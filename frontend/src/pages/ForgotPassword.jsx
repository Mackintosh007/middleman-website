import { useState } from "react";
import PageWrapper from "../components/PageWrapper";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 🚧 Backend will be added later
    // For now, just simulate success
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 800);
  };

  return (
    <PageWrapper>
      <div className="max-w-md mx-auto bg-white p-6 rounded border">
        <h1 className="text-2xl font-bold mb-2">
          Forgot Password
        </h1>

        <p className="text-sm text-gray-600 mb-6">
          Enter your email address and we’ll send you instructions
          to reset your password.
        </p>

        {submitted ? (
          <div className="bg-green-50 border border-green-200 p-4 rounded text-sm text-green-700">
            ✅ If an account with that email exists, a password reset
            link has been sent.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              className="input w-full"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}
      </div>
    </PageWrapper>
  );
}

export default ForgotPassword;
