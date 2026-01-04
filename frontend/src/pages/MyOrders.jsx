import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";
import { useAuth } from "../context/AuthContext";
import EmptyState from "../components/EmptyState";
import ConfirmDeliveryButton from "../components/ConfirmDeliveryButton";

function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders");
      setOrders(res.data || []);
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <PageWrapper>
        <p>Loading orders...</p>
      </PageWrapper>
    );
  }

  if (orders.length === 0) {
    return (
      <PageWrapper>
        <EmptyState
          title="No Orders Found"
          message="Orders related to your listings will appear here."
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => {
          const isBuyer = order.buyer_id === user.id;

          return (
            <div
              key={order.id}
              className="border rounded p-4 bg-white shadow-sm"
            >
              <h2 className="font-semibold text-lg">
                {order.title}
              </h2>

              <p className="mt-2 font-semibold">
                ₦{Number(order.amount).toLocaleString()}
              </p>

              <p className="text-sm mt-1 capitalize">
                Status: <strong>{order.status}</strong>
              </p>

              <p className="text-xs text-gray-500 mt-1">
                You are the {isBuyer ? "Buyer" : "Seller"}
              </p>

              {/* BUYER CONFIRM DELIVERY */}
              {isBuyer && (
                <ConfirmDeliveryButton
                  order={order}
                  onSuccess={fetchOrders}
                />
              )}
            </div>
          );
        })}
      </div>
    </PageWrapper>
  );
}

export default MyOrders;
