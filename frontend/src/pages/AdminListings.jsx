import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function AdminListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      const res = await api.get("/properties");
      setListings(res.data.results || []);
    } catch (err) {
      console.error("Failed to load listings", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, status) => {
    const newStatus = status === "active" ? "inactive" : "active";

    if (!window.confirm(`Set listing to ${newStatus}?`)) return;

    setActionLoading(id);

    try {
      await api.patch(`/properties/${id}/status`, {
        status: newStatus
      });

      setListings(l =>
        l.map(x =>
          x.id === id ? { ...x, status: newStatus } : x
        )
      );
    } catch (err) {
      alert("Status update failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">
        Listings Moderation
      </h1>

      {loading ? (
        <p>Loading listings...</p>
      ) : listings.length === 0 ? (
        <p className="text-gray-500">
          No listings found.
        </p>
      ) : (
        <div className="space-y-4">
          {listings.map(l => (
            <div
              key={l.id}
              className="border p-4 rounded bg-white"
            >
              <p className="font-semibold">{l.title}</p>

              <p className="text-sm text-gray-600">
                {l.property_type} • ₦
                {Number(l.price).toLocaleString()}
              </p>

              <p className="text-sm">
                Status:{" "}
                <strong
                  className={
                    l.status === "active"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {l.status}
                </strong>
              </p>

              <div className="mt-3">
                <button
                  disabled={actionLoading === l.id}
                  onClick={() =>
                    toggleStatus(l.id, l.status)
                  }
                  className={`px-3 py-1 rounded text-white disabled:opacity-50 ${
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
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}

export default AdminListings;
