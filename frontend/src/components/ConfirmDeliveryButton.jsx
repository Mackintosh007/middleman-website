import api from "../api/axios";
import { useState } from "react";

function ConfirmDeliveryButton({ order, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    const ok = window.confirm(
      "Are you sure you have received this item? This action will release the seller’s payment."
    );

    if (!ok) return;

    try {
      setLoading(true);
      setError("");

      await api.patch(
        `/orders/${order.id}/confirm-delivery`
      );

      alert("Delivery confirmed. Escrow released.");

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          "Unable to confirm delivery"
      );
    } finally {
      setLoading(false);
    }
  };

  // 🔒 Button visibility rules
  if (
    order.status !== "paid" ||
    order.delivery_confirmed
  ) {
    return null;
  }

  return (
    <div className="mt-3">
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Confirming..." : "Confirm Delivery"}
      </button>

      {error && (
        <p className="text-red-600 text-sm mt-2">
          {error}
        </p>
      )}
    </div>
  );
}

export default ConfirmDeliveryButton;
