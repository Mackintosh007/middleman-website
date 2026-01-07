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

  // ✅ ADD: delete listing
  const deleteListing = async (id) => {
    if (!window.confirm("Delete this listing?")) return;

    try {
      await api.delete(`/properties/${id}`);
      setProperties((prev) =>
        prev.filter((p) => p.id !== id)
      );
    } catch {
      alert("Failed to delete listing");
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
            <MyPropertyRow
              key={p.id}
              property={p}
              onEdit={() =>
                navigate(`/add-property-details/${p.id}`)
              }
              onToggleStatus={() =>
                toggleStatus(p.id, p.status)
              }
              onDelete={() => deleteListing(p.id)}
            />
          ))}
        </div>
      )}
    </PageWrapper>
  );
}

/* ===============================
   SINGLE PROPERTY ROW
   (NON-BREAKING ADDITION)
=============================== */
function MyPropertyRow({ property, onEdit, onToggleStatus, onDelete }) {
  const [image, setImage] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadImage = async () => {
      try {
        const res = await api.get(
          `/images/${property.id}`
        );
        if (mounted && res.data?.length) {
          setImage(res.data[0].image_url);
        }
      } catch {}
    };

    loadImage();
    return () => (mounted = false);
  }, [property.id]);

  return (
    <div className="border rounded-lg p-4 bg-white flex flex-col md:flex-row gap-6">
      {/* IMAGE */}
      <div className="w-full md:w-48 h-32 bg-gray-100 rounded overflow-hidden">
        <img
          src={
            image ||
            "https://via.placeholder.com/300x200?text=No+Image"
          }
          alt={property.title}
          className="w-full h-full object-contain"
        />
      </div>

      {/* INFO */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold">
          {property.title}
        </h3>

        <p className="text-sm text-gray-500">
          {property.location}
        </p>

        <p className="mt-2 font-bold text-blue-600">
          ₦{Number(property.price).toLocaleString()}
        </p>

        <span
          className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
            property.status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          {property.status}
        </span>

        <span className="inline-block ml-2 text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">
          {property.revenue_type === "escrow"
            ? "Escrow"
            : "Negotiation"}
        </span>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-col gap-2 min-w-[160px]">
        <button
          onClick={onEdit}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          ✏️ Edit
        </button>

        <button
          onClick={onToggleStatus}
          className={`px-3 py-2 text-sm text-white rounded ${
            property.status === "active"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {property.status === "active"
            ? "Deactivate"
            : "Activate"}
        </button>

        <button
          onClick={onDelete}
          className="px-3 py-2 text-sm bg-gray-800 text-white rounded hover:bg-black"
        >
          🗑 Delete
        </button>
      </div>
    </div>
  );
}

export default MyProperties;
