import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setError("Invalid verification link.");
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        await api.get(`/users/verify-email?token=${token}`);
        setSuccess(true);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            "Verification failed or link expired."
        );
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [searchParams]);

  return (
    <PageWrapper>
      <div className="max-w-xl mx-auto bg-white border rounded p-8 text-center">
        {loading && (
          <>
            <h2 className="text-xl font-semibold mb-4">
              Verifying your email…
            </h2>
            <p className="text-gray-600">
              Please wait while we confirm your email address.
            </p>
          </>
        )}

        {!loading && success && (
          <>
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              ✅ Email Verified!
            </h2>
            <p className="mb-6 text-gray-700">
              Your email has been successfully verified.  
              You can now log in to your account.
            </p>

            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Go to Login
            </button>
          </>
        )}

        {!loading && !success && (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              ❌ Verification Failed
            </h2>
            <p className="mb-6 text-gray-700">{error}</p>

            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </PageWrapper>
  );
}

export default VerifyEmail;
