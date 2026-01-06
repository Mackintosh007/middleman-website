import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await api.get("/orders/admin/pending");
      setOrders(res.data || []);
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  };

  const forceComplete = async id => {
    if (!window.confirm("Force complete this escrow order?")) return;

    setActionLoading(id);

    try {
      await api.patch(`/orders/${id}/complete`);
      setOrders(o => o.filter(x => x.id !== id));
    } catch (err) {
      alert("Failed to complete escrow");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">
        Escrow Orders
      </h1>

      {loading ? (
        <p>Loading escrow orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">
          No pending escrow orders.
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map(o => (
            <div
              key={o.id}
              className="border p-4 rounded bg-white"
            >
              <p className="font-semibold">
                {o.title}
              </p>

              <p className="text-sm">
                Buyer: <strong>{o.buyer_email}</strong>
              </p>

              <p className="text-sm">
                Amount: ₦
                {Number(o.amount).toLocaleString()}
              </p>

              <p className="text-sm">
                Status: <strong>{o.status}</strong>
              </p>

              <div className="mt-3">
                <button
                  disabled={actionLoading === o.id}
                  onClick={() => forceComplete(o.id)}
                  className="px-3 py-1 bg-purple-600 text-white rounded disabled:opacity-50"
                >
                  Force Complete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}

export default AdminOrders;
