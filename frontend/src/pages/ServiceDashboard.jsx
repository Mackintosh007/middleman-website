import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function ServiceDashboard() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  const [imagesMap, setImagesMap] = useState({});
  const [imageUploading, setImageUploading] = useState(false);

  const [editingService, setEditingService] = useState(null);
  const [form, setForm] = useState({
    description: "",
    location: "",
    phone: "",
    whatsapp: "",
  });

  // ✅ count only active + pending services as used slots
  const usedSlots = services.filter(
    (s) => s.status === "pending" || s.status === "active"
  ).length;

  const maxSlots = 2;

  /* ===============================
     LOAD SERVICES
  =============================== */
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

  /* ===============================
     LOAD IMAGES PER SERVICE
  =============================== */
  useEffect(() => {
    services.forEach((s) => fetchImages(s.id));
  }, [services]);

  const fetchImages = async (serviceId) => {
    try {
      const res = await api.get(`/service-images/${serviceId}`);
      setImagesMap((prev) => ({ ...prev, [serviceId]: res.data }));
    } catch {
      setImagesMap((prev) => ({ ...prev, [serviceId]: [] }));
    }
  };

  /* ===============================
     IMAGE DELETE
  =============================== */
  const deleteImage = async (imageId, serviceId) => {
    const images = imagesMap[serviceId] || [];

    if (images.length <= 1) {
      alert("Service must have at least one image");
      return;
    }

    if (!confirm("Delete this image?")) return;

    try {
      await api.delete(`/service-images/${imageId}`);
      setImagesMap((prev) => ({
        ...prev,
        [serviceId]: prev[serviceId].filter((img) => img.id !== imageId),
      }));
    } catch {
      alert("Failed to delete image");
    }
  };

  /* ===============================
     IMAGE UPLOAD
  =============================== */
  const uploadImages = async (serviceId, files) => {
    if (!files.length) return;

    const existing = imagesMap[serviceId]?.length || 0;
    if (existing + files.length > 5) {
      alert("Maximum of 5 images allowed");
      return;
    }

    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));

    try {
      setImageUploading(true);
      await api.post(`/service-images/${serviceId}`, fd);
      fetchImages(serviceId);
    } catch {
      alert("Image upload failed");
    } finally {
      setImageUploading(false);
    }
  };

  /* ===============================
     EDIT SERVICE
  =============================== */
  const startEdit = (service) => {
    setEditingService(service.id);
    setForm({
      description: service.description || "",
      location: service.location || "",
      phone: service.phone || "",
      whatsapp: service.whatsapp || "",
    });
  };

  const cancelEdit = () => {
    setEditingService(null);
  };

  const submitEdit = async (id) => {
    try {
      await api.put(`/services/${id}`, form);

      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...form } : s))
      );

      setEditingService(null);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update service");
    }
  };

  /* ===============================
     STATUS TOGGLE
  =============================== */
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
          s.id === service.id ? { ...s, status: newStatus } : s
        )
      );
    } catch {
      alert("Failed to update service status");
    } finally {
      setActionLoading(null);
    }
  };
   /* ===============================
   REAPPLY SERVICE
=============================== */
const reapplyService = () => {
  window.location.href = "/service-requests";
};


  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">My Services</h1>

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
            {/* ================= INFO ================= */}
            <h3 className="font-semibold text-lg">
              {service.category}
            </h3>

            <p className="text-sm text-gray-600 mt-1">
              Location: {service.location}
            </p>

            <p className="text-sm mt-2">{service.description}</p>

            <p className="text-sm mt-2">📞 {service.phone}</p>
            <p className="text-sm">💬 {service.whatsapp}</p>

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

            {/* ================= ACTIONS ================= */}
            {(service.status === "active" ||
              service.status === "inactive") && (
              <button
                onClick={() => toggleStatus(service)}
                disabled={actionLoading === service.id}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                {service.status === "active"
                  ? "Deactivate"
                  : "Activate"}
              </button>
            )}
            {service.status === "rejected" && usedSlots < maxSlots && (
              <button
                onClick={reapplyService}
                className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                🔄 Reapply for Service
              </button>
            )}

            {/* ================= EDIT ================= */}
{/* ================= EDIT ================= */}
{editingService === service.id ? (
  <div className="mt-4 space-y-2">
    <textarea
      className="input"
      value={form.description}
      onChange={(e) =>
        setForm({ ...form, description: e.target.value })
      }
    />

    <input
      className="input"
      value={form.location}
      onChange={(e) =>
        setForm({ ...form, location: e.target.value })
      }
    />

    <input
      className="input"
      value={form.phone}
      onChange={(e) =>
        setForm({ ...form, phone: e.target.value })
      }
    />

    <input
      className="input"
      value={form.whatsapp}
      onChange={(e) =>
        setForm({ ...form, whatsapp: e.target.value })
      }
    />

    <div className="flex gap-2">
      <button
        onClick={() => submitEdit(service.id)}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Save
      </button>
      <button
        onClick={cancelEdit}
        className="bg-gray-300 px-4 py-2 rounded"
      >
        Cancel
      </button>
    </div>
  </div>
) : (
  service.status !== "rejected" && (
    <button
      onClick={() => startEdit(service)}
      className="mt-3 text-blue-600 underline text-sm"
    >
      ✏️ Edit details
    </button>
  )
)}


            {/* ================= IMAGES ================= */}
            <div className="mt-4">
              <p className="text-sm font-semibold mb-2">
                Service Images
              </p>

              <div className="grid grid-cols-3 gap-3">
                {(imagesMap[service.id] || []).map((img) => (
                  <div
                    key={img.id}
                    className="relative border rounded overflow-hidden"
                  >
                    <img
                      src={img.image_url}
                      className="h-28 w-full object-contain bg-gray-100"
                    />
                    <button
                      onClick={() =>
                        deleteImage(img.id, service.id)
                      }
                      className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <input
                type="file"
                multiple
                accept="image/*"
                disabled={imageUploading}
                className="mt-3"
                onChange={(e) =>
                  uploadImages(
                    service.id,
                    Array.from(e.target.files)
                  )
                }
              />

              <p className="text-xs text-gray-500 mt-1">
                Max 5 images · At least 1 required
              </p>
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}

export default ServiceDashboard;
