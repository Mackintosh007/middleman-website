import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      const res = await api.get("/withdrawals/admin/pending");
      setWithdrawals(res.data || []);
    } catch (err) {
      console.error("Failed to load withdrawals", err);
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id) => {
    if (!window.confirm("Approve this withdrawal?")) return;
    setActionLoading(id);

    try {
      await api.patch(`/withdrawals/${id}/approve`);
      setWithdrawals((w) => w.filter((x) => x.id !== id));
    } catch (err) {
      alert("Approval failed");
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (id) => {
    if (!window.confirm("Reject & refund this withdrawal?")) return;
    setActionLoading(id);

    try {
      await api.patch(`/withdrawals/${id}/reject`);
      setWithdrawals((w) => w.filter((x) => x.id !== id));
    } catch (err) {
      alert("Rejection failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">
        Withdrawal Requests
      </h1>

      {loading ? (
        <p>Loading withdrawals...</p>
      ) : withdrawals.length === 0 ? (
        <p className="text-gray-500">
          No pending withdrawal requests.
        </p>
      ) : (
        <div className="overflow-x-auto bg-white border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left border">Seller</th>
                <th className="p-3 text-left border">Amount</th>
                <th className="p-3 text-left border">Bank Details</th>
                <th className="p-3 text-left border">Date</th>
                <th className="p-3 text-center border">Action</th>
              </tr>
            </thead>

            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id}>
                  <td className="p-3 border">
                    {w.email}
                  </td>

                  <td className="p-3 border font-semibold">
                    ₦{Number(w.amount).toLocaleString()}
                  </td>

                  {/* ✅ ADDED BANK INFO (SAFE DISPLAY) */}
                  <td className="p-3 border text-xs">
                    <p><strong>{w.bank_name}</strong></p>
                    <p>{w.account_number}</p>
                    <p className="text-gray-600">{w.account_name}</p>
                  </td>

                  <td className="p-3 border">
                    {new Date(w.created_at).toLocaleDateString()}
                  </td>

                  <td className="p-3 border text-center space-x-2">
                    <button
                      disabled={actionLoading === w.id}
                      onClick={() => approve(w.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-xs disabled:opacity-50"
                    >
                      Approve
                    </button>

                    <button
                      disabled={actionLoading === w.id}
                      onClick={() => reject(w.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-xs disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageWrapper>
  );
}

export default AdminWithdrawals;
