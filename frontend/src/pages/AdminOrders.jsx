import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const res = await api.get("/orders");
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const releaseFunds = async (id) => {
    if (!window.confirm("Confirm delivery and release funds?")) {
      return;
    }

    try {
      await api.post(`/admin/orders/${id}/release`);
      loadOrders();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to release funds");
    }
  };

  if (loading) {
    return <PageWrapper>Loading orders...</PageWrapper>;
  }

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">Escrow Orders</h1>

      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Order ID</th>
              <th className="border p-2">Item</th>
              <th className="border p-2">Buyer Paid</th>
              <th className="border p-2">Seller Payout</th>
              <th className="border p-2">Platform Earnings</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const sellerPayout = o.amount - o.platform_fee;
              const platformEarnings =
                o.platform_fee + o.delivery_fee;

              return (
                <tr key={o.id}>
                  <td className="border p-2">{o.id}</td>
                  <td className="border p-2">{o.property_id}</td>
                  <td className="border p-2">
                    ₦{Number(o.total_amount).toLocaleString()}
                  </td>
                  <td className="border p-2">
                    ₦{Number(sellerPayout).toLocaleString()}
                  </td>
                  <td className="border p-2">
                    ₦{Number(platformEarnings).toLocaleString()}
                  </td>
                  <td className="border p-2">{o.status}</td>
                  <td className="border p-2">
                    {o.status === "funds_held" && (
                      <button
                        onClick={() => releaseFunds(o.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Release Funds
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
}

export default AdminOrders;
