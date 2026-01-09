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

  // ⭐ Review state
  const [reviewingOrderId, setReviewingOrderId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittedReviews, setSubmittedReviews] = useState([]);

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
      setError(err.response?.data?.error || "Unable to mark delivery");
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
      setError(err.response?.data?.error || "Unable to confirm delivery");
    } finally {
      setActionLoading(null);
    }
  };

  const submitReview = async (order) => {
    try {
      setActionLoading(order.id);
      setError("");

      await api.post("/reviews", {
        order_id: order.id,
        rating,
        comment,
      });

      setSubmittedReviews((prev) => [...prev, order.id]);
      setReviewingOrderId(null);
      setRating(5);
      setComment("");

      alert("Review submitted successfully");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit review");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {loading && <p>Loading orders...</p>}
      {error && <p className="mb-4 text-red-600">{error}</p>}

      {!loading && orders.length === 0 && (
        <p className="text-gray-500">You have no orders yet.</p>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const isBuyer = order.buyer_id === user.id;
          const isSeller = order.seller_id === user.id;
          const alreadyReviewed = submittedReviews.includes(order.id);

          return (
            <div
              key={order.id}
              className="border rounded p-4 bg-white shadow-sm"
            >
              <h3 className="font-semibold">{order.title}</h3>

              <p className="text-sm text-gray-600 mt-1">
                Amount: ₦{Number(order.total_amount).toLocaleString()}
              </p>

              <p className="text-sm mt-1">
                Status:{" "}
                <strong>
                  {order.status === "pending" && "Pending Payment"}
                  {order.status === "paid" && "Paid (In Escrow)"}
                  {order.status === "completed" && "Completed"}
                </strong>
              </p>

              {/* ===============================
                  SELLER ACTIONS
              =============================== */}
              {isSeller &&
                order.status === "paid" &&
                !order.delivery_confirmed && (
                  <button
                    onClick={() => markDelivered(order.id)}
                    disabled={actionLoading === order.id}
                    className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Mark as Delivered
                  </button>
                )}

              {/* ===============================
                  BUYER ACTIONS
              =============================== */}
              {isBuyer &&
                order.status === "paid" &&
                order.delivery_confirmed && (
                  <button
                    onClick={() => confirmDelivery(order.id)}
                    disabled={actionLoading === order.id}
                    className="mt-3 bg-green-600 text-white px-4 py-2 rounded"
                  >
                    Confirm Delivery
                  </button>
                )}

              {isBuyer &&
                order.status === "paid" &&
                !order.delivery_confirmed && (
                  <p className="mt-2 text-sm text-blue-600">
                    Waiting for seller to mark delivery
                  </p>
                )}

              {/* ===============================
                  ⭐ RATE SELLER (NEW)
              =============================== */}
              {isBuyer &&
                order.status === "completed" &&
                !alreadyReviewed && (
                  <>
                    <button
                      onClick={() => setReviewingOrderId(order.id)}
                      className="mt-3 bg-yellow-500 text-white px-4 py-2 rounded"
                    >
                      Rate Seller
                    </button>

                    {reviewingOrderId === order.id && (
                      <div className="mt-4 border-t pt-4">
                        <label className="block text-sm mb-1">
                          Rating
                        </label>
                        <select
                          value={rating}
                          onChange={(e) =>
                            setRating(Number(e.target.value))
                          }
                          className="input mb-2"
                        >
                          {[5, 4, 3, 2, 1].map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>

                        <textarea
                          placeholder="Leave a comment (optional)"
                          className="input mb-2"
                          value={comment}
                          onChange={(e) =>
                            setComment(e.target.value)
                          }
                        />

                        <button
                          onClick={() => submitReview(order)}
                          disabled={actionLoading === order.id}
                          className="bg-green-600 text-white px-4 py-2 rounded"
                        >
                          Submit Review
                        </button>
                      </div>
                    )}
                  </>
                )}

              {isBuyer &&
                order.status === "completed" &&
                alreadyReviewed && (
                  <p className="mt-2 text-sm text-green-600">
                    Review submitted. Thank you!
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
