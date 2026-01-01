import { useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function VerifyPhone() {
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const requestOtp = async () => {
    setError("");
    const res = await api.post("/otp/request");
    setSentOtp(res.data.otp); // dev only
    setMessage("OTP sent to your phone");
  };

  const verifyOtp = async () => {
    try {
      await api.post("/otp/verify", { otp });
      setMessage("Phone number verified successfully");
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed");
    }
  };

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">
        Verify Phone Number
      </h1>

      {message && <p className="text-green-600 mb-3">{message}</p>}
      {error && <p className="text-red-600 mb-3">{error}</p>}

      <button
        onClick={requestOtp}
        className="btn-primary mb-4"
      >
        Send OTP
      </button>

      {sentOtp && (
        <p className="text-sm text-gray-500 mb-4">
          DEV OTP: <strong>{sentOtp}</strong>
        </p>
      )}

      <input
        className="input mb-3"
        placeholder="Enter OTP"
        value={otp}
        onChange={e => setOtp(e.target.value)}
      />

      <button
        onClick={verifyOtp}
        className="btn-primary"
      >
        Verify
      </button>
    </PageWrapper>
  );
}

export default VerifyPhone;
