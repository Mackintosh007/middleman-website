import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function AdminPendingDeliveries() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/orders/admin/pending-delivery")
      .then(res => setOrders(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-8">
        📦 Paid Orders Awaiting Delivery
      </h1>

      {loading ? (
        <p>Loading…</p>
      ) : orders.length === 0 ? (
        <p>No pending deliveries.</p>
      ) : (
        orders.map(o => (
          <div
            key={o.order_id}
            className="border rounded p-5 mb-4 bg-white"
          >
            <p className="font-semibold text-lg">{o.title}</p>
            <p className="text-sm text-gray-600">
              {o.property_type} • {o.location}
            </p>

            <div className="grid md:grid-cols-2 gap-4 mt-4 text-sm">
              <div>
                <p className="font-semibold">Buyer</p>
                <p>{o.buyer_first_name} {o.buyer_last_name}</p>
                <p>📞 {o.buyer_phone}</p>
              </div>

              <div>
                <p className="font-semibold">Seller</p>
                <p>{o.seller_first_name} {o.seller_last_name}</p>
                <p>📞 {o.seller_phone}</p>
              </div>
            </div>

            <p className="mt-4 font-semibold">
              Amount: ₦{Number(o.amount).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </PageWrapper>
  );
}

export default AdminPendingDeliveries;
