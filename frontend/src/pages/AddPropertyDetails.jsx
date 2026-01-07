import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

import LandForm from "../components/forms/LandForm";
import HouseForm from "../components/forms/HouseForm";
import ApartmentForm from "../components/forms/ApartmentForm";
import GadgetForm from "../components/forms/GadgetForm";
import AutomobileForm from "../components/forms/AutomobileForm";
import OthersForm from "../components/forms/OthersForm";

function AddPropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  /* ===============================
     LOAD PROPERTY
  =============================== */
  useEffect(() => {
    api.get(`/properties/${id}`).then(res => {
      setProperty(res.data);
    });
  }, [id]);

  /* ===============================
     LOAD PROPERTY IMAGES
  =============================== */
  useEffect(() => {
    api.get(`/images/${id}`).then(res => {
      setImages(res.data || []);
    });
  }, [id]);

  const onSuccess = () => {
    navigate(`/properties/${id}`);
  };

  /* ===============================
     UPLOAD IMAGE (MAX 5)
  =============================== */
  const uploadImage = async (file) => {
    if (!file) return;

    if (images.length >= 5) {
      alert("You can upload a maximum of 5 images.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    try {
      const res = await api.post(`/images/${id}`, formData);
      setImages(prev => [...prev, res.data]);
    } catch (err) {
      alert(
        err.response?.data?.error || "Image upload failed"
      );
    } finally {
      setUploading(false);
    }
  };

  /* ===============================
     DELETE IMAGE
  =============================== */
  const deleteImage = async (imageId) => {
    if (!window.confirm("Delete this image?")) return;

    try {
      await api.delete(`/images/${imageId}`);
      setImages(images.filter(img => img.id !== imageId));
    } catch (err) {
      alert("Failed to delete image");
    }
  };

  if (!property) {
    return <div className="p-10">Loading...</div>;
  }

  return (
    <div className="p-10 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">
        {property.property_type} details
      </h1>

      {/* ===============================
          UPLOAD IMAGE
      =============================== */}
      <div className="mb-6">
        <label className="block font-medium mb-2">
          Upload Images ({images.length}/5)
        </label>

        <input
          type="file"
          accept="image/*"
          disabled={uploading || images.length >= 5}
          onChange={(e) =>
            uploadImage(e.target.files[0])
          }
        />

        {uploading && (
          <p className="text-sm text-gray-500 mt-1">
            Uploading image...
          </p>
        )}

        {images.length >= 5 && (
          <p className="text-sm text-red-500 mt-1">
            Maximum of 5 images reached
          </p>
        )}
      </div>

      {/* ===============================
          EXISTING IMAGES
      =============================== */}
      {images.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold mb-2">
            Uploaded Images
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {images.map(img => (
              <div key={img.id} className="relative">
                <img
                  src={img.image_url}
                  alt="Property"
                  className="rounded border"
                />

                <button
                  type="button"
                  onClick={() => deleteImage(img.id)}
                  className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===============================
          FORMS (UNCHANGED)
      =============================== */}
      {property.property_type === "land" && (
        <LandForm propertyId={id} onSuccess={onSuccess} />
      )}

      {property.property_type === "house" && (
        <HouseForm propertyId={id} onSuccess={onSuccess} />
      )}

      {property.property_type === "apartment" && (
        <ApartmentForm propertyId={id} onSuccess={onSuccess} />
      )}

      {(property.property_type === "gadget" ||
          property.property_type === "equipment") && (
          <GadgetForm propertyId={id} onSuccess={onSuccess} />
      )}


      {property.property_type === "car" && (
        <AutomobileForm propertyId={id} onSuccess={onSuccess} />
      )}

      {property.property_type === "others" && (
        <OthersForm propertyId={id} onSuccess={onSuccess} />
      )}
    </div>
  );
}

export default AddPropertyDetails;
