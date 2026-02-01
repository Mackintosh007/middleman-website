import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function AdminDashboard() {
  const openWhatsApp = (phone, message) => {
  const clean = phone.replace(/\D/g, "");
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
};
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);

  const [sellerRequests, setSellerRequests] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);

  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);

  /* ===============================
     LOAD STATS
  =============================== */
  useEffect(() => {
    api.get("/admin/stats").then(res => setStats(res.data)).catch(() => {});
    api.get("/admin/revenue").then(res => setRevenue(res.data)).catch(() => {});
  }, []);

  /* ===============================
     LOAD SELLER REQUESTS
  =============================== */
  useEffect(() => {
    api.get("/seller-requests")
      .then(res => setSellerRequests(res.data))
      .catch(() => {});
  }, []);

  /* ===============================
     LOAD SERVICE REQUESTS (NEW)
  =============================== */
  useEffect(() => {
    api
      .get("/service-requests/admin/pending")
      .then(res => setServiceRequests(res.data))
      .finally(() => setLoadingServices(false));
  }, []);

  /* ===============================
     LOAD WITHDRAWALS
  =============================== */
  useEffect(() => {
    api
      .get("/withdrawals/admin/pending")
      .then(res => setWithdrawals(res.data))
      .finally(() => setLoadingWithdrawals(false));
  }, []);

  /* ===============================
     ACTIONS
  =============================== */
  const approveSeller = async id => {
    await api.patch(`/seller-requests/${id}/approve`);
    setSellerRequests(r => r.filter(x => x.id !== id));
  };

  const rejectSeller = async id => {
    await api.patch(`/seller-requests/${id}/reject`);
    setSellerRequests(r => r.filter(x => x.id !== id));
  };

  const approveService = async id => {
    await api.patch(`/service-requests/${id}/approve`);
    setServiceRequests(r => r.filter(x => x.id !== id));
  };

  const rejectService = async id => {
    await api.patch(`/service-requests/${id}/reject`);
    setServiceRequests(r => r.filter(x => x.id !== id));
  };

  const approveWithdrawal = async id => {
    await api.patch(`/withdrawals/${id}/approve`);
    setWithdrawals(w => w.filter(x => x.id !== id));
  };

  const rejectWithdrawal = async id => {
    await api.patch(`/withdrawals/${id}/reject`);
    setWithdrawals(w => w.filter(x => x.id !== id));
  };

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-10">🛡 Admin Dashboard</h1>

      {/* ===============================
          PLATFORM OVERVIEW (UNCHANGED)
      =============================== */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
          <StatCard label="👤 Unverified Users" value={stats.users} link="/admin/users" />
          <StatCard label="🧾 Seller Requests" value={stats.seller_requests} link="/admin/seller-requests" />
          <StatCard label="💸 Withdrawals" value={stats.withdrawals} link="/admin/withdrawals" />
          <StatCard label="📦 Pending Orders" value={stats.orders} link="/admin/orders" />
          <StatCard label="🛠 Service Requests" value={stats.service_requests} link="/admin/services" />
        </div>
      )}

      {/* ===============================
          FINANCIAL OVERVIEW (UNCHANGED)
      =============================== */}
      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-14">
          <StatCard
            label="👛 Seller Wallets"
            value={`₦${Number(revenue.wallets.total_wallet).toLocaleString()}`}
            link="/admin/revenue"
          />
          <StatCard
            label="⏳ Pending Payouts"
            value={`₦${Number(revenue.wallets.total_pending).toLocaleString()}`}
            link="/admin/withdrawals"
          />
          <StatCard
            label="🏦 Platform Commission"
            value={`₦${Number(revenue.commission.total_commission).toLocaleString()}`}
            link="/admin/revenue"
          />
          <StatCard
            label="🔐 Escrow Volume"
            value={`₦${Number(revenue.escrow.total_volume).toLocaleString()}`}
            link="/admin/orders"
          />
          <StatCard
            label="📦 Pending Deliveries"
            value={stats.orders}
            link="/admin/pending-deliveries"
          />

        </div>
      )}

      {/* ===============================
          SERVICE REQUESTS (NEW, SAFE)
      =============================== */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-4">🛠 Service Requests</h2>

        {loadingServices ? (
          <p>Loading service requests…</p>
        ) : serviceRequests.length === 0 ? (
          <p>No pending service requests.</p>
        ) : (
          serviceRequests.map(r => (
            <div key={r.id} className="border p-4 mb-4 rounded bg-white">
              <p className="font-semibold">{r.first_name} {r.last_name}</p>
              <p className="text-sm">{r.email}</p>

              <div className="mt-3 flex gap-3">
                <button onClick={() => approveService(r.id)} className="bg-green-600 text-white px-3 py-1 rounded">
                  Approve
                </button>
                <button onClick={() => rejectService(r.id)} className="bg-red-600 text-white px-3 py-1 rounded">
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* ===============================
          SELLER REQUESTS (UNCHANGED)
      =============================== */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-4">Seller Requests</h2>

        {sellerRequests.length === 0 ? (
          <p>No pending seller requests.</p>
        ) : (
          sellerRequests.map(r => (
            <div key={r.id} className="border p-4 mb-4 rounded bg-white">
              <p className="font-semibold">{r.first_name} {r.last_name}</p>
              <p className="text-sm">{r.email}</p>

              <div className="mt-3 flex gap-3">
                <button onClick={() => approveSeller(r.id)} className="bg-green-600 text-white px-3 py-1 rounded">
                  Approve
                </button>
                <button onClick={() => rejectSeller(r.id)} className="bg-red-600 text-white px-3 py-1 rounded">
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* ===============================
          WITHDRAWALS (UNCHANGED)
      =============================== */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-4">Withdrawal Requests</h2>

        {loadingWithdrawals ? (
          <p>Loading withdrawals…</p>
        ) : withdrawals.length === 0 ? (
          <p>No pending withdrawal requests.</p>
        ) : (
          withdrawals.map(w => (
            <div key={w.id} className="border p-4 mb-4 rounded bg-white">
              <p className="font-semibold">{w.email}</p>
              <p className="text-sm">
                Amount: ₦{Number(w.amount).toLocaleString()}
              </p>

              <div className="mt-3 flex gap-3">
                <button onClick={() => approveWithdrawal(w.id)} className="bg-green-600 text-white px-3 py-1 rounded">
                  Approve
                </button>
                <button onClick={() => rejectWithdrawal(w.id)} className="bg-red-600 text-white px-3 py-1 rounded">
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </PageWrapper>
  );
}

/* ===============================
   STAT CARD (RESTORED CLICKABLE)
=============================== */
function StatCard({ label, value, link }) {
  return (
    <a
      href={link}
      className="border rounded p-6 bg-white hover:shadow transition block"
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </a>
  );
}

export default AdminDashboard;
