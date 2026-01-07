import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";
import { useAuth } from "../context/AuthContext";

function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders/my");
      setOrders(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const markDelivered = async (orderId) => {
    try {
      setActionLoading(orderId);
      setError("");

      await api.patch(`/orders/${orderId}/mark-delivered`);
      await fetchOrders();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          "Unable to mark delivery"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelivery = async (orderId) => {
    try {
      setActionLoading(orderId);
      setError("");

      await api.patch(`/orders/${orderId}/confirm-delivery`);
      await fetchOrders();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          "Unable to confirm delivery"
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">
        My Orders
      </h1>

      {loading && <p>Loading orders...</p>}

      {error && (
        <p className="mb-4 text-red-600">{error}</p>
      )}

      {!loading && orders.length === 0 && (
        <p className="text-gray-500">
          You have no orders yet.
        </p>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const isBuyer = order.buyer_id === user.id;
          const isSeller = order.seller_id === user.id;

          return (
            <div
              key={order.id}
              className="border rounded p-4 bg-white shadow-sm"
            >
              <h3 className="font-semibold">
                {order.title}
              </h3>

              <p className="text-sm text-gray-600 mt-1">
                Amount: ₦
                {Number(order.total_amount).toLocaleString()}
              </p>

              <p className="text-sm mt-1">
                Status:{" "}
                <span className="font-semibold">
                  {order.status === "pending" &&
                    "Pending Payment"}
                  {order.status === "paid" &&
                    "Paid (In Escrow)"}
                  {order.status === "completed" &&
                    "Completed"}
                </span>
              </p>

              {/* ===============================
                  SELLER ACTION
              =============================== */}
              {isSeller &&
                order.status === "paid" &&
                !order.delivery_confirmed && (
                  <button
                    onClick={() =>
                      markDelivered(order.id)
                    }
                    disabled={
                      actionLoading === order.id
                    }
                    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    {actionLoading === order.id
                      ? "Marking..."
                      : "Mark as Delivered"}
                  </button>
                )}

              {isSeller &&
                order.status === "paid" &&
                order.delivery_confirmed && (
                  <p className="mt-2 text-sm text-green-600">
                    Delivery marked. Waiting for buyer
                    confirmation.
                  </p>
                )}

              {/* ===============================
                  BUYER ACTION
              =============================== */}
              {isBuyer &&
                order.status === "paid" &&
                order.delivery_confirmed && (
                  <button
                    onClick={() =>
                      confirmDelivery(order.id)
                    }
                    disabled={
                      actionLoading === order.id
                    }
                    className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    {actionLoading === order.id
                      ? "Confirming..."
                      : "Confirm Delivery"}
                  </button>
                )}

              {/* ✅ ADDED (AS REQUESTED, NO OTHER CHANGES) */}
              {isBuyer &&
                order.status === "paid" &&
                !order.delivery_confirmed && (
                  <p className="mt-2 text-sm text-blue-600">
                    Waiting for seller to mark delivery
                  </p>
                )}
            </div>
          );
        })}
      </div>
    </PageWrapper>
  );
}

export default MyOrders;
