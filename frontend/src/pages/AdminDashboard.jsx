import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function AdminDashboard() {
  const [sellerRequests, setSellerRequests] = useState([]);
  const [escrowOrders, setEscrowOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);

  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingListings, setLoadingListings] = useState(true);

  /* ===============================
     LOAD SELLER REQUESTS
  =============================== */
  useEffect(() => {
    api
      .get("/admin/seller-requests")
      .then(res => setSellerRequests(res.data))
      .catch(() => {});
  }, []);

  /* ===============================
     LOAD ESCROW ORDERS (ADMIN)
  =============================== */
  useEffect(() => {
    api
      .get("/admin/orders")
      .then(res =>
        setEscrowOrders(
          res.data.filter(o => o.status === "funds_held")
        )
      )
      .catch(() => {});
  }, []);

  /* ===============================
     LOAD USERS
  =============================== */
  useEffect(() => {
    api
      .get("/users")
      .then(res => setUsers(res.data))
      .finally(() => setLoadingUsers(false));
  }, []);

  /* ===============================
     LOAD LISTINGS
  =============================== */
  useEffect(() => {
    api
      .get("/properties")
      .then(res => setListings(res.data))
      .finally(() => setLoadingListings(false));
  }, []);

  /* ===============================
     LOAD WITHDRAWALS
  =============================== */
  useEffect(() => {
    api
      .get("/admin/withdrawals")
      .then(res => setWithdrawals(res.data))
      .finally(() => setLoadingWithdrawals(false));
  }, []);

  /* ===============================
     SELLER REQUEST ACTIONS
  =============================== */
  const approveRequest = async id => {
    await api.patch(`/admin/seller-requests/${id}/approve`);
    setSellerRequests(r => r.filter(x => x.id !== id));
  };

  const rejectRequest = async id => {
    await api.patch(`/admin/seller-requests/${id}/reject`);
    setSellerRequests(r => r.filter(x => x.id !== id));
  };

  /* ===============================
     ESCROW ACTIONS
  =============================== */
  const releaseEscrow = async id => {
    await api.post(`/admin/orders/${id}/release`);
    setEscrowOrders(o => o.filter(x => x.id !== id));
  };

  /* ===============================
     USER VERIFICATION
  =============================== */
  const toggleVerification = async (id, verified) => {
    const res = await api.patch(`/admin/users/${id}/verify`, {
      verified: !verified,
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

    await api.patch(`/admin/properties/${id}/status`, {
      status: newStatus,
    });

    setListings(listings =>
      listings.map(l =>
        l.id === id ? { ...l, status: newStatus } : l
      )
    );
  };

  /* ===============================
     WITHDRAWAL ACTION
  =============================== */
  const payWithdrawal = async id => {
    await api.post(`/admin/withdrawals/${id}/pay`);
    setWithdrawals(w => w.filter(x => x.id !== id));
  };

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-10">
        Admin Dashboard
      </h1>

      {/* USERS */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-4">
          User Verification
        </h2>

        {loadingUsers ? (
          <p>Loading users...</p>
        ) : (
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
        )}
      </section>

      {/* SELLER REQUESTS */}
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

      {/* WITHDRAWALS */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-4">
          Withdrawal Requests
        </h2>

        {loadingWithdrawals ? (
          <p>Loading withdrawals...</p>
        ) : withdrawals.length === 0 ? (
          <p>No pending withdrawals.</p>
        ) : (
          withdrawals.map(w => (
            <div
              key={w.id}
              className="border p-4 mb-4 rounded bg-white"
            >
              <p className="font-semibold">{w.email}</p>
              <p>₦{Number(w.amount).toLocaleString()}</p>

              <button
                onClick={() => payWithdrawal(w.id)}
                className="mt-3 bg-green-600 text-white px-3 py-1 rounded"
              >
                Pay
              </button>
            </div>
          ))
        )}
      </section>

      {/* ESCROW ORDERS */}
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
              <p className="font-semibold">Order #{o.id}</p>
              <p>₦{Number(o.amount).toLocaleString()}</p>

              <button
                onClick={() => releaseEscrow(o.id)}
                className="mt-3 bg-green-600 text-white px-3 py-1 rounded"
              >
                Release Escrow
              </button>
            </div>
          ))
        )}
      </section>
    </PageWrapper>
  );
}

export default AdminDashboard;
