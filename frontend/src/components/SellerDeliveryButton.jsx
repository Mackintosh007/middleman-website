import api from "../api/axios";
import { useState } from "react";

function SellerDeliveryButton({ order, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Only show when:
  // - Order is paid
  // - Not yet delivered
  if (order.status !== "paid" || order.delivery_confirmed) {
    return null;
  }

  const markDelivered = async () => {
    try {
      setLoading(true);
      setError("");

      await api.patch(`/orders/${order.id}/mark-delivered`);

      onSuccess && onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to confirm delivery"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {error && (
        <p className="text-sm text-red-600 mb-2">
          {error}
        </p>
      )}

      <button
        onClick={markDelivered}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
      >
        {loading ? "Confirming..." : "Mark as Delivered"}
      </button>
    </div>
  );
}

export default SellerDeliveryButton;
