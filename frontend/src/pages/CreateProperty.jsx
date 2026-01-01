import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";
import { useAuth } from "../context/AuthContext";
import { LOCATIONS } from "../utils/locations";

function CreateProperty() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [propertyType, setPropertyType] = useState("land");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  // ✅ NEW: image state
  const [images, setImages] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <PageWrapper>
        <p className="text-red-600">
          You must be logged in to create a listing.
        </p>
      </PageWrapper>
    );
  }

  // ✅ NEW: image handler
  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1️⃣ Create property (UNCHANGED)
      const res = await api.post("/properties", {
        property_type: propertyType,
        title,
        description,
        location,
        price,
      });

      const propertyId = res.data.id;

      // 2️⃣ Upload images (ONLY if selected)
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((img) =>
          formData.append("images", img)
        );
        formData.append("property_id", propertyId);

        await api.post("/images/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      // 3️⃣ Continue your normal flow
      navigate(`/add-property-details/${propertyId}`);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to create listing"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <h1 className="text-2xl font-semibold mb-6">
        Create New Listing
      </h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-4"
      >
        {error && (
          <p className="text-red-600">{error}</p>
        )}

        {/* LISTING TYPE */}
        <div>
          <label className="block mb-1 font-medium">
            Listing Type
          </label>
          <select
            className="input"
            value={propertyType}
            onChange={(e) =>
              setPropertyType(e.target.value)
            }
            required
          >
            <option value="land">Land</option>
            <option value="house">House</option>
            <option value="apartment">Apartment</option>
            <option value="automobile">Automobile</option>
            <option value="gadget">Gadget</option>
            <option value="equipment">Equipment</option>
            <option value="others">Others</option>
          </select>
        </div>

        {/* TITLE */}
        <div>
          <label className="block mb-1 font-medium">
            Title
          </label>
          <input
            className="input"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            required
          />
        </div>

        {/* LOCATION */}
        <div>
          <label className="block mb-1 font-medium">
            Location (Omoku / ONELGA)
          </label>
          <select
            className="input"
            value={location}
            onChange={(e) =>
              setLocation(e.target.value)
            }
            required
          >
            <option value="">
              Select a location
            </option>
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* PRICE */}
        <div>
          <label className="block mb-1 font-medium">
            Price (₦)
          </label>
          <input
            type="number"
            className="input"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value)
            }
            required
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="block mb-1 font-medium">
            Description
          </label>
          <textarea
            className="input h-28"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />
        </div>

        {/* ✅ NEW: IMAGE UPLOAD */}
        <div>
          <label className="block mb-1 font-medium">
            Listing Images
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
          <p className="text-sm text-gray-500 mt-1">
            You can upload multiple images
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading
            ? "Creating..."
            : "Create Listing"}
        </button>
      </form>
    </PageWrapper>
  );
}

export default CreateProperty;
