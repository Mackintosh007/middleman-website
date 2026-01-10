import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  const fetchServices = async () => {
    try {
      const res = await api.get("/services/admin/pending");
      setServices(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load pending services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const approveService = async (id) => {
    try {
      setActionLoading(id);
      await api.patch(`/services/${id}/approve`);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert("Failed to approve service");
    } finally {
      setActionLoading(null);
    }
  };

  const rejectService = async (id) => {
    try {
      setActionLoading(id);
      await api.patch(`/services/${id}/reject`);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert("Failed to reject service");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">
        Pending Service Requests
      </h1>

      {loading && <p>Loading services...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && services.length === 0 && (
        <p className="text-gray-500">
          No pending service requests.
        </p>
      )}

      <div className="space-y-4">
        {services.map((service) => (
          <div
            key={service.id}
            className="border rounded p-4 bg-white shadow-sm"
          >
            <div className="flex justify-between items-start gap-6">
              {/* INFO */}
              <div>
                <h3 className="font-semibold text-lg">
                  {service.category}
                </h3>

                <p className="text-sm text-gray-600 mt-1">
                  Provider: {service.user_email}
                </p>

                <p className="text-sm text-gray-600">
                  Location: {service.location}
                </p>

                <p className="text-sm mt-2">
                  {service.description}
                </p>

                <p className="text-sm mt-2">
                  📞 {service.phone}
                </p>

                <p className="text-sm">
                  💬 {service.whatsapp}
                </p>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => approveService(service.id)}
                  disabled={actionLoading === service.id}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  Approve
                </button>

                <button
                  onClick={() => rejectService(service.id)}
                  disabled={actionLoading === service.id}
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
