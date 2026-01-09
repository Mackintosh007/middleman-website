import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function ServiceDashboard() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  const fetchServices = async () => {
    try {
      const res = await api.get("/services/mine");
      setServices(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load your services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const toggleStatus = async (service) => {
    try {
      setActionLoading(service.id);

      const newStatus =
        service.status === "active" ? "inactive" : "active";

      await api.patch(`/services/${service.id}/status`, {
        status: newStatus,
      });

      setServices((prev) =>
        prev.map((s) =>
          s.id === service.id
            ? { ...s, status: newStatus }
            : s
        )
      );
    } catch (err) {
      alert("Failed to update service status");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">
        My Services
      </h1>

      {loading && <p>Loading services...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && services.length === 0 && (
        <p className="text-gray-500">
          You have not submitted any services yet.
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

                <p className="mt-2 text-sm">
                  Status:{" "}
                  <strong
                    className={
                      service.status === "active"
                        ? "text-green-600"
                        : service.status === "pending"
                        ? "text-yellow-600"
                        : "text-gray-500"
                    }
                  >
                    {service.status}
                  </strong>
                </p>
              </div>

              {/* ACTION */}
              <div className="flex flex-col gap-2">
                {service.status === "pending" && (
                  <p className="text-sm text-yellow-600">
                    Awaiting admin approval
                  </p>
                )}

                {(service.status === "active" ||
                  service.status === "inactive") && (
                  <button
                    onClick={() => toggleStatus(service)}
                    disabled={actionLoading === service.id}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    {service.status === "active"
                      ? "Deactivate"
                      : "Activate"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}

export default ServiceDashboard;
