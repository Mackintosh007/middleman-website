import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";
import { useAuth } from "../context/AuthContext";
import EmptyState from "../components/EmptyState";


function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders");
        setOrders(res.data);
      } catch (err) {
        console.error("Failed to load orders", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return <PageWrapper>Loading orders...</PageWrapper>;
  }

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <p className="text-gray-600">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div
              key={order.id}
              className="border rounded p-4 bg-white shadow-sm"
            >
              <h2 className="font-semibold text-lg">
                {order.title}
              </h2>

              <p className="text-gray-600">{order.location}</p>

              <p className="mt-2 font-semibold">
                ₦{Number(order.amount).toLocaleString()}
              </p>

              <p className="text-sm mt-1 capitalize">
                Status:{" "}
                <span className="font-medium">{order.status}</span>
              </p>

              <p className="text-xs text-gray-500 mt-1">
                You are the{" "}
                {order.buyer_id === user.id ? "Buyer" : "Seller"}
              </p>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
<EmptyState
  title="No Orders Found"
  message="Orders related to your listings will appear here."
/>

export default MyOrders;
