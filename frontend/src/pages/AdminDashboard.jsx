import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function AdminDashboard() {
  const [sellerRequests, setSellerRequests] = useState([]);
  const [escrowOrders, setEscrowOrders] = useState([]);
  const [listings, setListings] = useState([]);

  // ✅ WITHDRAWALS
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);

  const [loadingListings, setLoadingListings] = useState(true);

  // ✅ ADMIN STATS
  const [stats, setStats] = useState(null);

  /* ===============================
     LOAD ADMIN STATS
  =============================== */
  useEffect(() => {
    api
      .get("/admin/stats")
      .then(res => setStats(res.data))
      .catch(() => {});
  }, []);

  /* ===============================
     LOAD SELLER REQUESTS
  =============================== */
  useEffect(() => {
    api
      .get("/seller-requests")
      .then(res => setSellerRequests(res.data))
      .catch(() => {});
  }, []);

  /* ===============================
     LOAD ESCROW ORDERS
  =============================== */
  useEffect(() => {
    api
      .get("/orders/admin/pending")
      .then(res => setEscrowOrders(res.data))
      .catch(() => {});
  }, []);

  /* ===============================
     LOAD LISTINGS
  =============================== */
  useEffect(() => {
    api
      .get("/properties")
      .then(res => setListings(res.data.results))
      .finally(() => setLoadingListings(false));
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
     SELLER REQUEST ACTIONS
  =============================== */
  const approveRequest = async id => {
    await api.patch(`/seller-requests/${id}/approve`);
    setSellerRequests(r => r.filter(x => x.id !== id));
  };

  const rejectRequest = async id => {
    await api.patch(`/seller-requests/${id}/reject`);
    setSellerRequests(r => r.filter(x => x.id !== id));
  };

  /* ===============================
     ESCROW ACTIONS
  =============================== */
  const updateEscrow = async id => {
    await api.patch(`/orders/${id}/complete`);
    setEscrowOrders(o => o.filter(x => x.id !== id));
  };

  /* ===============================
     LISTING STATUS
  =============================== */
  const toggleListingStatus = async (id, status) => {
    const newStatus = status === "active" ? "inactive" : "active";

    await api.patch(`/properties/${id}/status`, {
      status: newStatus
    });

    setListings(listings =>
      listings.map(l =>
        l.id === id ? { ...l, status: newStatus } : l
      )
    );
  };

  /* ===============================
     WITHDRAWAL ACTIONS
  =============================== */
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
      <h1 className="text-2xl font-bold mb-10">
        Admin Dashboard
      </h1>

      {/* ===============================
          ADMIN OVERVIEW
      =============================== */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard
            label="Unverified Users"
            value={stats.users}
            link="/admin/users"
          />
          <StatCard
            label="Seller Requests"
            value={stats.seller_requests}
            link="/admin/seller-requests"
          />
          <StatCard
            label="Withdrawals"
            value={stats.withdrawals}
            link="/admin/withdrawals"
          />
          <StatCard
            label="Pending Orders"
            value={stats.orders}
            link="/admin/orders"
          />
          <StatCard
            label="Service Requests"
            value={stats.service_requests}
            link="/admin/services"
          />

        </div>
      )}

      {/* ===============================
          QUICK ACTIONS (UPDATED)
      =============================== */}
      <div className="mb-10 flex gap-4 flex-wrap">
        <a
          href="/admin/users"
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
        >
          👤 Manage Users
        </a>

        <a
          href="/admin/seller-requests"
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          🧾 Seller Requests
        </a>

        {/* ✅ NEW: SERVICE REQUESTS LINK */}
        <a
          href="/admin/services"
          className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
        >
          🛠 Service Requests
        </a>

        <a
          href="/admin/withdrawals"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          💸 Withdrawal Requests
        </a>

        <a
          href="/admin/orders"
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          📦 Escrow Orders
        </a>

        <a
          href="/admin/revenue"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          📊 Platform Revenue
        </a>
      </div>

      {/* ===============================
          SELLER REQUESTS
      =============================== */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-4">
          Seller Requests
        </h2>

        {sellerRequests.length === 0 ? (
          <p>No pending seller requests.</p>
        ) : (
          sellerRequests.map(r => (
            <div
              key={r.id}
              className="border p-4 mb-4 rounded bg-white"
            >
              <p className="font-semibold">
                {r.first_name} {r.last_name}
              </p>
              <p className="text-sm">{r.email}</p>
              <p className="text-sm">
                Requested role: {r.requested_role}
              </p>

              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => approveRequest(r.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => rejectRequest(r.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* ===============================
          WITHDRAWAL REQUESTS
      =============================== */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-4">
          Withdrawal Requests
        </h2>

        {loadingWithdrawals ? (
          <p>Loading withdrawals...</p>
        ) : withdrawals.length === 0 ? (
          <p>No pending withdrawal requests.</p>
        ) : (
          withdrawals.map(w => (
            <div
              key={w.id}
              className="border p-4 mb-4 rounded bg-white"
            >
              <p className="font-semibold">{w.email}</p>
              <p className="text-sm">
                Amount: ₦{Number(w.amount).toLocaleString()}
              </p>

              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => approveWithdrawal(w.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => rejectWithdrawal(w.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
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
   STAT CARD
=============================== */
function StatCard({ label, value, link }) {
  return (
    <a
      href={link}
      className="border rounded p-6 bg-white hover:shadow transition"
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </a>
  );
}

export default AdminDashboard;
