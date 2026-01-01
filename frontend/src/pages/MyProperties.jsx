import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";
import EmptyState from "../components/EmptyState";


function MyProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyProperties();
  }, []);

  const fetchMyProperties = async () => {
    try {
      const res = await api.get("/properties/mine");
      setProperties(res.data.results || res.data || []);
    } catch (err) {
      console.error("Failed to load my properties", err);
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     ACTIONS
  =============================== */

  const toggleStatus = async (id, status) => {
    const newStatus =
      status === "active" ? "inactive" : "active";

    await api.patch(`/properties/${id}/status`, {
      status: newStatus,
    });

    setProperties((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: newStatus } : p
      )
    );
  };

  const duplicateListing = async (id) => {
    try {
      const res = await api.post(
        `/properties/${id}/duplicate`
      );
      setProperties((prev) => [
        res.data,
        ...prev,
      ]);
    } catch (err) {
      alert("Failed to duplicate listing");
    }
  };

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          My Listings
        </h1>
        <p className="text-gray-600">
          Manage, edit, and track your listings.
        </p>
      </div>

      {loading ? (
        <p>Loading your listings...</p>
      ) : properties.length === 0 ? (
        <EmptyState
          title="No Listings Yet"
          message="You haven’t added any listings. Start selling today."
          actionText="Add New Listing"
          actionLink="/create-property"
        />

      ) : (
        <div className="space-y-6">
          {properties.map((p) => (
            <div
              key={p.id}
              className="border rounded-lg p-4 bg-white flex flex-col md:flex-row gap-6"
            >
              {/* IMAGE */}
              <img
                src={
                  p.image ||
                  "https://via.placeholder.com/300x200?text=No+Image"
                }
                alt={p.title}
                className="w-full md:w-48 h-32 object-cover rounded"
              />

              {/* INFO */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {p.title}
                </h3>

                <p className="text-sm text-gray-500">
                  {p.location}
                </p>

                <p className="mt-2 font-bold text-blue-600">
                  ₦{Number(p.price).toLocaleString()}
                </p>

                {/* STATUS */}
                <span
                  className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                    p.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {p.status}
                </span>

                {/* REVENUE TYPE */}
                <span className="inline-block ml-2 text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">
                  {p.revenue_type === "escrow"
                    ? "Escrow"
                    : "Negotiation"}
                </span>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-col gap-2 min-w-[160px]">
                <button
                  onClick={() =>
                    navigate(
                      `/add-property-details/${p.id}`
                    )
                  }
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  ✏️ Edit
                </button>

                <button
                  onClick={() => duplicateListing(p.id)}
                  className="px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  📄 Duplicate
                </button>

                <button
                  onClick={() =>
                    toggleStatus(p.id, p.status)
                  }
                  className={`px-3 py-2 text-sm text-white rounded ${
                    p.status === "active"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {p.status === "active"
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

export default MyProperties;
