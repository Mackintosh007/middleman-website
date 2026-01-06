import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function AdminDashboard() {
  const [sellerRequests, setSellerRequests] = useState([]);
  const [escrowOrders, setEscrowOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);

  // ✅ WITHDRAWALS
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingListings, setLoadingListings] = useState(true);

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
     LOAD USERS ✅ FIXED
  =============================== */
  useEffect(() => {
    api
      .get("/users")
      .then(res => setUsers(res.data))
      .finally(() => setLoadingUsers(false));
  }, []);

  /* ===============================
     LOAD LISTINGS ✅ FIXED
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
     ESCROW ACTIONS ✅ FIXED
  =============================== */
  const updateEscrow = async (id) => {
    await api.patch(`/orders/${id}/complete`);
    setEscrowOrders(o => o.filter(x => x.id !== id));
  };

  /* ===============================
     USER VERIFICATION
  =============================== */
  const toggleVerification = async (id, verified) => {
    const res = await api.patch(`/users/${id}/verify`, {
      verified: !verified
    });

    setUsers(users =>
      users.map(u =>
        u.id === id ? { ...u, verified: res.data.verified } : u
      )
    );
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

      {/* QUICK ACTIONS */}
      <div className="mb-10 flex gap-4 flex-wrap">
        <a
          href="/admin/withdrawals"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          💸 Withdrawal Requests
        </a>

        <a
          href="/admin/revenue"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          📊 Platform Revenue
        </a>

        <a
          href="/admin/orders"
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          📦 Escrow Orders
        </a>
      </div>

      {/* ===============================
          USERS
      =============================== */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-4">
          User Verification
        </h2>

        {loadingUsers ? (
          <p>Loading users...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Role</th>
                  <th className="p-2 border">Verified</th>
                  <th className="p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="text-center">
                    <td className="p-2 border">
                      {u.first_name} {u.last_name}
                    </td>
                    <td className="p-2 border">{u.email}</td>
                    <td className="p-2 border capitalize">
                      {u.role.replace("_", " ")}
                    </td>
                    <td className="p-2 border">
                      {u.verified ? "✅ Yes" : "❌ No"}
                    </td>
                    <td className="p-2 border">
                      <button
                        onClick={() =>
                          toggleVerification(u.id, u.verified)
                        }
                        className={`px-3 py-1 rounded text-white ${
                          u.verified
                            ? "bg-red-600"
                            : "bg-green-600"
                        }`}
                      >
                        {u.verified ? "Unverify" : "Verify"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
              <p className="font-semibold">
                {w.email}
              </p>
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

      {/* ===============================
          LISTINGS MODERATION
      =============================== */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-4">
          Listings Moderation
        </h2>

        {loadingListings ? (
          <p>Loading listings...</p>
        ) : listings.length === 0 ? (
          <p>No listings found.</p>
        ) : (
          listings.map(l => (
            <div
              key={l.id}
              className="border p-4 mb-4 rounded bg-white"
            >
              <p className="font-semibold">{l.title}</p>
              <p className="text-sm text-gray-600">
                {l.property_type} — ₦
                {Number(l.price).toLocaleString()}
              </p>

              <button
                onClick={() =>
                  toggleListingStatus(l.id, l.status)
                }
                className={`mt-3 px-3 py-1 rounded text-white ${
                  l.status === "active"
                    ? "bg-red-600"
                    : "bg-green-600"
                }`}
              >
                {l.status === "active"
                  ? "Deactivate"
                  : "Activate"}
              </button>
            </div>
          ))
        )}
      </section>

      {/* ===============================
          ESCROW ORDERS
      =============================== */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Pending Escrow Orders
        </h2>

        {escrowOrders.length === 0 ? (
          <p>No pending escrow orders.</p>
        ) : (
          escrowOrders.map(o => (
            <div
              key={o.id}
              className="border p-4 mb-4 rounded bg-white"
            >
              <p className="font-semibold">{o.title}</p>
              <p className="text-sm">
                Buyer: {o.buyer_email}
              </p>
              <p className="text-sm">
                Amount: ₦{Number(o.amount).toLocaleString()}
              </p>

              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => updateEscrow(o.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Release Escrow
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </PageWrapper>
  );
}

export default AdminDashboard;
