import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function CreateListing() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    property_type: "gadget",
    title: "",
    location: "",
    price: "",
    description: "",
  });

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImages = (e) => {
    setImages(Array.from(e.target.files));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      /**
       * ===============================
       * 1️⃣ CREATE LISTING FIRST
       * ===============================
       */
      const listingRes = await api.post("/properties", {
        property_type: form.property_type,
        title: form.title,
        location: form.location,
        price: Number(form.price),
        description: form.description,
      });

      const propertyId = listingRes.data.id;

      /**
       * ===============================
       * 2️⃣ UPLOAD IMAGES (MAX 5)
       * ===============================
       */
      for (let i = 0; i < images.length; i++) {
        const formData = new FormData();
        formData.append("image", images[i]); // ✅ MUST BE "image"

        await api.post(
          `/images/${propertyId}`, // ✅ CORRECT ROUTE
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      /**
       * ===============================
       * 3️⃣ DONE
       * ===============================
       */
      alert("Listing created successfully");
      navigate("/dashboard");

    } catch (err) {
      console.error("CREATE LISTING ERROR:", err);
      setError(
        err.response?.data?.error || "Failed to create listing"
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
        <p className="mb-4 text-red-600">{error}</p>
      )}

      <form
        onSubmit={submit}
        className="space-y-4 max-w-lg"
      >
        <select
          name="property_type"
          className="input"
          value={form.property_type}
          onChange={handleChange}
        >
          <option value="land">Land</option>
          <option value="house">House</option>
          <option value="apartment">Apartment</option>
          <option value="automobile">Automobile</option>
          <option value="gadget">Gadget</option>
          <option value="equipment">Equipment</option>
          <option value="fashion">Fashion</option>
          <option value="furniture">Furniture</option>
          <option value="building_material">Building Material</option>
        </select>

        <input
          name="title"
          placeholder="Title"
          className="input"
          value={form.title}
          onChange={handleChange}
          required
        />

        <input
          name="location"
          placeholder="Location"
          className="input"
          value={form.location}
          onChange={handleChange}
          required
        />

        <input
          name="price"
          type="number"
          placeholder="Price (₦)"
          className="input"
          value={form.price}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          className="input"
          rows={4}
          value={form.description}
          onChange={handleChange}
          required
        />

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImages}
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
