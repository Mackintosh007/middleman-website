import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function CreateListing() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    category: "",
    title: "",
    location: "",
    price: "",
    description: "",
  });

  const [images, setImages] = useState([]);
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
     CREATE LISTING + UPLOAD IMAGES
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
      /* ===============================
         1️⃣ CREATE PROPERTY
      =============================== */
      const propertyRes = await api.post("/properties", {
        property_type: form.category,
        title: form.title,
        location: form.location,
        price: form.price,
        description: form.description,
      });

      const propertyId = propertyRes.data.id;

      /* ===============================
         2️⃣ UPLOAD IMAGES
      =============================== */
      const formData = new FormData();

      images.forEach((file) => {
        formData.append("images", file); // ✅ MUST be "images"
      });

      await api.post(
        `/images/upload/${propertyId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      /* ===============================
         DONE
      =============================== */
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

        <select
          name="category"
          className="input"
          onChange={handleChange}
          required
        >
          <option value="">Listing Type</option>
          <option value="gadget">Gadget</option>
          <option value="land">Land</option>
          <option value="house">House</option>
          <option value="apartment">Apartment</option>
          <option value="automobile">Automobile</option>
        </select>

        <input
          name="title"
          placeholder="Title"
          className="input"
          onChange={handleChange}
          required
        />

        <input
          name="location"
          placeholder="Location"
          className="input"
          onChange={handleChange}
        />

        <input
          name="price"
          type="number"
          placeholder="Price (₦)"
          className="input"
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          className="input"
          onChange={handleChange}
        />

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImages}
          required
        />

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
