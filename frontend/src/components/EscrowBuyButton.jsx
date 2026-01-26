import { useState } from "react";
import api from "../api/axios";

function EscrowBuyButton({ property }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBuy = async () => {
    try {
      setLoading(true);
      setError("");

      // 1️⃣ Create escrow order
      const orderRes = await api.post("/orders", {
        property_id: property.id,
      });

      const order = orderRes.data;

      // 2️⃣ Initialize Paystack via ORDER
      const payRes = await api.post(`/orders/${order.id}/pay`);

      // 3️⃣ Redirect to Paystack
      window.location.href = payRes.data.authorization_url;
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "Unable to start escrow payment"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleBuy}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-semibold disabled:opacity-50"
      >
        {loading ? "Redirecting..." : "Pay Now"}
      </button>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      <p className="mt-2 text-xs text-gray-500">
        Funds will be held securely until delivery is completed and confirmed.
      </p>
    </div>
  );
}

export default EscrowBuyButton;
