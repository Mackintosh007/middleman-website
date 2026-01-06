import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function AdminSellerRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const res = await api.get("/seller-requests");
      setRequests(res.data || []);
    } catch (err) {
      console.error("Failed to load seller requests", err);
    } finally {
      setLoading(false);
    }
  };

  const approve = async id => {
    if (!window.confirm("Approve this seller request?")) return;
    setActionLoading(id);

    try {
      await api.patch(`/seller-requests/${id}/approve`);
      setRequests(r => r.filter(x => x.id !== id));
    } catch (err) {
      alert("Approval failed");
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async id => {
    if (!window.confirm("Reject this seller request?")) return;
    setActionLoading(id);

    try {
      await api.patch(`/seller-requests/${id}/reject`);
      setRequests(r => r.filter(x => x.id !== id));
    } catch (err) {
      alert("Rejection failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">
        Seller Requests
      </h1>

      {loading ? (
        <p>Loading seller requests...</p>
      ) : requests.length === 0 ? (
        <p className="text-gray-500">
          No pending seller requests.
        </p>
      ) : (
        <div className="space-y-4">
          {requests.map(r => (
            <div
              key={r.id}
              className="border p-4 rounded bg-white"
            >
              <p className="font-semibold">
                {r.first_name} {r.last_name}
              </p>
              <p className="text-sm">{r.email}</p>
              <p className="text-sm">
                Requested role:{" "}
                <strong>{r.requested_role}</strong>
              </p>

              <div className="mt-3 flex gap-3">
                <button
                  disabled={actionLoading === r.id}
                  onClick={() => approve(r.id)}
                  className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
                >
                  Approve
                </button>

                <button
                  disabled={actionLoading === r.id}
                  onClick={() => reject(r.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}

export default AdminSellerRequests;
