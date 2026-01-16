import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";
import { LOCATIONS } from "../utils/locations";

function CreateListing() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    category: "",
    title: "",
    location: "",
    price: "",
    description: "",
    condition: ""
  });

  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ===============================
     HANDLE INPUTS
  =============================== */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImages = (e) => {
    setImages(Array.from(e.target.files));
  };

  /* ===============================
     CREATE LISTING (ATOMIC)
  =============================== */
  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.category || !form.title || !form.price) {
      return setError("Please fill all required fields");
    }

    if (images.length === 0) {
      return setError("Please upload at least one image");
    }

    if (images.length > 5) {
      return setError("Maximum of 5 images allowed");
    }

    setLoading(true);

    try {
      const formData = new FormData();

      // 🔒 PROPERTY DATA
      formData.append("property_type", form.category);
      formData.append("title", form.title);
      formData.append("location", form.location);
      formData.append("price", form.price);
      formData.append("description", form.description);
      formData.append("condition", form.condition || "");

      // 🔒 IMAGES (REQUIRED)
      images.forEach((file) => {
        formData.append("images", file);
      });
      // 🎞 OPTIONAL VIDEO
      if (video) {
        formData.append("video", video);
      }

      // ✅ SINGLE ATOMIC REQUEST
      await api.post("/properties", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert("Listing created successfully");
      navigate("/dashboard");

    } catch (err) {
      console.error("CREATE LISTING ERROR:", err);
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
      <h1 className="text-2xl font-bold mb-6">
        Create New Listing
      </h1>

      {error && (
        <p className="mb-4 text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="space-y-4 max-w-lg">

        {/* CATEGORY */}
        <select
          name="category"
          className="input"
          onChange={handleChange}
          required
        >
          <option value="">Listing Type</option>
          <option value="land">Land</option>
          <option value="house">House</option>
          <option value="apartment">Apartment</option>
          <option value="car">Automobile</option>
          <option value="gadget">Gadgets</option>
          <option value="equipment">Equipment</option>
          <option value="fashion">Fashion</option>
          <option value="furniture">Furniture</option>
          <option value="building_materials">
            Building Materials
          </option>
        </select>

        {/* CONDITION */}
        <select
          name="condition"
          className="input"
          onChange={handleChange}
        >
          <option value="">Condition (optional)</option>
          <option value="new">New</option>
          <option value="used">Used</option>
        </select>

        {/* TITLE */}
        <input
          name="title"
          placeholder="Title"
          className="input"
          onChange={handleChange}
          required
        />

        {/* LOCATION */}
        <select
          name="location"
          className="input"
          value={form.location}
          onChange={handleChange}
        >
          <option value="">Select location</option>
          {LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        {/* PRICE */}
        <input
          name="price"
          type="number"
          placeholder="Price (₦)"
          className="input"
          onChange={handleChange}
          required
        />

        {/* DESCRIPTION */}
        <textarea
          name="description"
          placeholder="Description"
          className="input"
          onChange={handleChange}
        />

        {/* IMAGES */}
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImages}
          required
        />

        {/* 🎞 OPTIONAL VIDEO (COMMISSION ONLY) */}
        {!["gadget","equipment","fashion","furniture","building_materials"].includes(form.category) && (
          <div>
            <label className="block text-sm font-medium mt-3 mb-1">
              Product Video (optional)
            </label>
            <input
              type="file"
              accept="video/mp4,video/webm"
              onChange={(e) => setVideo(e.target.files[0])}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional · MP4/WebM · Commission listings only
            </p>
          </div>
        )}

        <button
          disabled={loading}
          className="btn-primary"
        >
          {loading ? "Creating..." : "Create Listing"}
        </button>

      </form>
    </PageWrapper>
  );
}

export default CreateListing;
