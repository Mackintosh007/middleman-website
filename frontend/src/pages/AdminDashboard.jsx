import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function AdminDashboard() {
  const [sellerRequests, setSellerRequests] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);
  const [serviceRequests, setServiceRequests] = useState([]);


  // Admin stats
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);

  /* ===============================
     LOAD REVENUE
  =============================== */
  useEffect(() => {
    api.get("/admin/revenue")
      .then(res => setRevenue(res.data))
      .catch(() => {});
  }, []);

  /* ===============================
     LOAD ADMIN STATS
  =============================== */
  useEffect(() => {
    api.get("/admin/stats")
      .then(res => setStats(res.data))
      .catch(() => {});
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
     LOAD WITHDRAWALS
  =============================== */
  useEffect(() => {
    api.get("/withdrawals/admin/pending")
      .then(res => setWithdrawals(res.data))
      .finally(() => setLoadingWithdrawals(false));
  }, []);

  useEffect(() => {
    api
      .get("/service-requests/admin/pending")
      .then(res => setServiceRequests(res.data))
      .catch(() => {});
  }, []);

  /* ===============================
     ACTIONS
  =============================== */
  const approveRequest = async id => {
    await api.patch(`/seller-requests/${id}/approve`);
    setSellerRequests(r => r.filter(x => x.id !== id));
  };

  const rejectRequest = async id => {
    await api.patch(`/seller-requests/${id}/reject`);
    setSellerRequests(r => r.filter(x => x.id !== id));
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
      <h1 className="text-3xl font-extrabold mb-10 flex items-center gap-2">
        🛡 Admin Dashboard
      </h1>

      {/* ===============================
          PLATFORM OVERVIEW
      =============================== */}
      {stats && (
        <>
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Platform Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
            <StatCard icon="👤" label="Unverified Users" value={stats.users} link="/admin/users" variant="indigo" />
            <StatCard icon="🧾" label="Seller Requests" value={stats.seller_requests} link="/admin/seller-requests" variant="orange" />
            <StatCard icon="💸" label="Withdrawals" value={stats.withdrawals} link="/admin/withdrawals" variant="green" />
            <StatCard icon="📦" label="Pending Orders" value={stats.orders} link="/admin/orders" variant="purple" />
            <StatCard icon="🛠" label="Service Requests" value={stats.service_requests} link="/admin/services" variant="teal" />
          </div>
        </>
      )}

      {/* ===============================
          FINANCIAL OVERVIEW
      =============================== */}
      {revenue && (
        <>
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Financial Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-14">
            <StatCard
              icon="👛"
              label="Seller Wallets"
              value={`₦${Number(revenue.wallets.total_wallet).toLocaleString()}`}
              link="/admin/revenue"
              variant="blue"
            />
            <StatCard
              icon="⏳"
              label="Pending Payouts"
              value={`₦${Number(revenue.wallets.total_pending).toLocaleString()}`}
              link="/admin/withdrawals"
              variant="yellow"
            />
            <StatCard
              icon="🏦"
              label="Platform Commission"
              value={`₦${Number(revenue.commission.total_commission).toLocaleString()}`}
              link="/admin/revenue"
              variant="emerald"
            />
            <StatCard
              icon="🔐"
              label="Escrow Volume"
              value={`₦${Number(revenue.escrow.total_volume).toLocaleString()}`}
              link="/admin/orders"
              variant="rose"
            />
          </div>
        </>
      )}

      {/* ===============================
          SELLER REQUESTS
      =============================== */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-4">Seller Requests</h2>

        {sellerRequests.length === 0 ? (
          <p className="text-gray-500">No pending seller requests.</p>
        ) : (
          sellerRequests.map(r => (
            <div key={r.id} className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
              <p className="font-semibold">{r.first_name} {r.last_name}</p>
              <p className="text-sm text-gray-600">{r.email}</p>
              <p className="text-sm">Requested role: {r.requested_role}</p>

              <div className="mt-3 flex gap-3">
                <button onClick={() => approveRequest(r.id)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded">
                  Approve
                </button>
                <button onClick={() => rejectRequest(r.id)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded">
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </section>
      <section className="mb-14">
  <h2 className="text-xl font-semibold mb-4">
    Service Requests
  </h2>

  {serviceRequests.length === 0 ? (
    <p>No pending service requests.</p>
  ) : (
    serviceRequests.map(r => (
      <div key={r.id} className="border p-4 mb-4 rounded bg-white">
        <p className="font-semibold">
          {r.first_name} {r.last_name}
        </p>
        <p className="text-sm">{r.email}</p>
        <p className="text-xs text-gray-500">
          Requested on {new Date(r.created_at).toLocaleDateString()}
        </p>
      </div>
    ))
  )}
</section>

      {/* ===============================
          WITHDRAWALS
      =============================== */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-4">Withdrawal Requests</h2>

        {loadingWithdrawals ? (
          <p>Loading withdrawals...</p>
        ) : withdrawals.length === 0 ? (
          <p className="text-gray-500">No pending withdrawal requests.</p>
        ) : (
          withdrawals.map(w => (
            <div key={w.id} className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
              <p className="font-semibold">{w.email}</p>
              <p className="text-sm">
                Amount: ₦{Number(w.amount).toLocaleString()}
              </p>

              <div className="mt-3 flex gap-3">
                <button onClick={() => approveWithdrawal(w.id)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded">
                  Approve
                </button>
                <button onClick={() => rejectWithdrawal(w.id)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded">
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
   STAT CARD (FIXED COLORS)
=============================== */
function StatCard({ label, value, link, icon, variant }) {
  const styles = {
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-900",
    orange: "bg-orange-50 border-orange-200 text-orange-900",
    green: "bg-green-50 border-green-200 text-green-900",
    purple: "bg-purple-50 border-purple-200 text-purple-900",
    teal: "bg-teal-50 border-teal-200 text-teal-900",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
    rose: "bg-rose-50 border-rose-200 text-rose-900",
  };

  return (
    <a
      href={link}
      className={`border rounded-xl p-6 shadow-sm hover:shadow-md transition ${styles[variant]}`}
    >
      <p className="text-sm font-medium opacity-80 mb-1">
        {icon} {label}
      </p>
      <p className="text-3xl font-extrabold">{value}</p>
    </a>
  );
}

export default AdminDashboard;
