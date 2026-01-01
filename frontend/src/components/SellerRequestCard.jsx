import { useState, useEffect } from "react";
import api from "../api/axios";

function SellerRequestCard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Optional: later we can add endpoint to check request status
    setLoading(false);
  }, []);

  const requestRole = async role => {
    setError("");
    try {
      const res = await api.post("/seller-requests", {
        requested_role: role
      });
      setStatus(res.data.status);
    } catch (err) {
      setError(
        err.response?.data?.error || "Request failed"
      );
    }
  };

  if (loading) return null;

  return (
    <div className="border p-4 rounded-md mt-6">
      <h2 className="font-semibold mb-2">Seller Account</h2>

      {status === "pending" ? (
        <p className="text-yellow-600">
          Your request is pending admin approval.
        </p>
      ) : (
        <>
          <button
            className="btn-primary mr-2"
            onClick={() => requestRole("individual_seller")}
          >
            Become Individual Seller
          </button>

          <button
            className="btn-secondary"
            onClick={() => requestRole("agent")}
          >
            Become Agent
          </button>
        </>
      )}

      {error && (
        <p className="text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}

export default SellerRequestCard;
