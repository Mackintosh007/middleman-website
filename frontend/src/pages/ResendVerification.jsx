import { useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function ResendVerification() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/users/resend-verification", { email });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-md mx-auto bg-white border rounded p-6">
        <h2 className="text-xl font-semibold mb-4">
          Resend Verification Email
        </h2>

        {sent ? (
          <p className="text-green-600">
            If the email exists, a verification link has been sent.
          </p>
        ) : (
          <form onSubmit={submit}>
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 rounded mb-4"
            />
            <button
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded"
            >
              {loading ? "Sending..." : "Resend Email"}
            </button>
          </form>
        )}
      </div>
    </PageWrapper>
  );
}

export default ResendVerification;
