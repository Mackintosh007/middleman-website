import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function AdminServices() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  /* ===============================
     LOAD PENDING SERVICE REQUESTS
  =============================== */
  const fetchRequests = async () => {
    try {
      const res = await api.get(
        "/service-requests/admin/pending"
      );
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load pending service requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  /* ===============================
     ACTIONS
  =============================== */
  const approveRequest = async (id) => {
    try {
      setActionLoading(id);
      await api.patch(`/service-requests/services/${id}/approve`);
      setRequests((prev) =>
        prev.filter((r) => r.id !== id)
      );
    } catch {
      alert("Failed to approve service request");
    } finally {
      setActionLoading(null);
    }
  };

  const rejectRequest = async (id) => {
    try {
      setActionLoading(id);
      await api.patch(`/service-requests/${id}/reject`);
      setRequests((prev) =>
        prev.filter((r) => r.id !== id)
      );
    } catch {
      alert("Failed to reject service request");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">
        Pending Service Requests
      </h1>

      {loading && <p>Loading service requests...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && requests.length === 0 && (
        <p className="text-gray-500">
          No pending service requests.
        </p>
      )}

      <div className="space-y-4">
        {requests.map((req) => (
          <div
            key={req.id}
            className="border rounded p-4 bg-white shadow-sm"
          >
            <div className="flex justify-between items-start gap-6">
              {/* INFO */}
              <div>
                <p className="font-semibold text-lg">
                  {req.first_name} {req.last_name}
                </p>

                <p className="text-sm text-gray-600">
                  {req.email}
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  Requested services: {req.service_count}
                </p>

                <p className="text-sm text-gray-500">
                  Submitted on{" "}
                  {new Date(req.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => approveRequest(req.id)}
                  disabled={actionLoading === req.id}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  Approve
                </button>

                <button
                  onClick={() => rejectRequest(req.id)}
                  disabled={actionLoading === req.id}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}

export default AdminServices;
