import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function AdminDashboard() {
  const [sellerRequests, setSellerRequests] = useState([]);
  const [escrowOrders, setEscrowOrders] = useState([]);
  const [listings, setListings] = useState([]);

  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);

  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);

  useEffect(() => {
    api.get("/admin/revenue").then(res => setRevenue(res.data)).catch(() => {});
    api.get("/admin/stats").then(res => setStats(res.data)).catch(() => {});
    api.get("/seller-requests").then(res => setSellerRequests(res.data)).catch(() => {});
    api.get("/withdrawals/admin/pending")
      .then(res => setWithdrawals(res.data))
      .finally(() => setLoadingWithdrawals(false));
  }, []);

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
      <h1 className="text-3xl font-extrabold mb-10 tracking-tight">
        🛡 Admin Dashboard
      </h1>

      {/* ===============================
          PLATFORM OVERVIEW
      =============================== */}
      {stats && (
        <>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Platform Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
            <StatCard color="indigo" icon="👤" label="Unverified Users" value={stats.users} link="/admin/users" />
            <StatCard color="orange" icon="🧾" label="Seller Requests" value={stats.seller_requests} link="/admin/seller-requests" />
            <StatCard color="green" icon="💸" label="Withdrawals" value={stats.withdrawals} link="/admin/withdrawals" />
            <StatCard color="purple" icon="📦" label="Pending Orders" value={stats.orders} link="/admin/orders" />
            <StatCard color="teal" icon="🛠" label="Service Requests" value={stats.service_requests} link="/admin/services" />
          </div>
        </>
      )}

      {/* ===============================
          FINANCIAL OVERVIEW
      =============================== */}
      {revenue && (
        <>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Financial Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-14">
            <StatCard
              color="blue"
              icon="👛"
              label="Seller Wallets"
              value={`₦${Number(revenue.wallets.total_wallet).toLocaleString()}`}
              link="/admin/revenue"
            />
            <StatCard
              color="yellow"
              icon="⏳"
              label="Pending Payouts"
              value={`₦${Number(revenue.wallets.total_pending).toLocaleString()}`}
              link="/admin/withdrawals"
            />
            <StatCard
              color="emerald"
              icon="🏦"
              label="Platform Commission"
              value={`₦${Number(revenue.commission.total_commission).toLocaleString()}`}
              link="/admin/revenue"
            />
            <StatCard
              color="rose"
              icon="🔐"
              label="Escrow Volume"
              value={`₦${Number(revenue.escrow.total_volume).toLocaleString()}`}
              link="/admin/orders"
            />
          </div>
        </>
      )}

      {/* ===============================
          SELLER REQUESTS
      =============================== */}
      <Section title="Seller Requests">
        {sellerRequests.length === 0 ? (
          <Empty text="No pending seller requests." />
        ) : (
          sellerRequests.map(r => (
            <Card key={r.id}>
              <p className="font-semibold">{r.first_name} {r.last_name}</p>
              <p className="text-sm text-gray-500">{r.email}</p>
              <p className="text-sm">Requested role: {r.requested_role}</p>

              <div className="mt-4 flex gap-3">
                <ActionButton color="green" onClick={() => approveRequest(r.id)}>Approve</ActionButton>
                <ActionButton color="red" onClick={() => rejectRequest(r.id)}>Reject</ActionButton>
              </div>
            </Card>
          ))
        )}
      </Section>

      {/* ===============================
          WITHDRAWALS
      =============================== */}
      <Section title="Withdrawal Requests">
        {loadingWithdrawals ? (
          <Empty text="Loading withdrawals..." />
        ) : withdrawals.length === 0 ? (
          <Empty text="No pending withdrawal requests." />
        ) : (
          withdrawals.map(w => (
            <Card key={w.id}>
              <p className="font-semibold">{w.email}</p>
              <p className="text-sm">
                Amount: <strong>₦{Number(w.amount).toLocaleString()}</strong>
              </p>

              <div className="mt-4 flex gap-3">
                <ActionButton color="green" onClick={() => approveWithdrawal(w.id)}>Approve</ActionButton>
                <ActionButton color="red" onClick={() => rejectWithdrawal(w.id)}>Reject</ActionButton>
              </div>
            </Card>
          ))
        )}
      </Section>
    </PageWrapper>
  );
}

/* ===============================
   REUSABLE UI COMPONENTS
=============================== */

function StatCard({ label, value, link, color, icon }) {
  return (
    <a
      href={link}
      className={`rounded-xl p-6 text-white shadow-lg hover:scale-[1.02] transition bg-gradient-to-br
        from-${color}-500 to-${color}-600`}
    >
      <p className="text-sm opacity-90">{icon} {label}</p>
      <p className="text-3xl font-extrabold mt-2">{value}</p>
    </a>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-16">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Card({ children }) {
  return (
    <div className="bg-white border rounded-xl p-5 mb-4 shadow-sm hover:shadow transition">
      {children}
    </div>
  );
}

function ActionButton({ color, children, ...props }) {
  return (
    <button
      {...props}
      className={`px-4 py-1.5 rounded text-white text-sm bg-${color}-600 hover:bg-${color}-700`}
    >
      {children}
    </button>
  );
}

function Empty({ text }) {
  return <p className="text-gray-500">{text}</p>;
}

export default AdminDashboard;
