import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    location: "",
    price: "",
    description: ""
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/properties/${id}`);
        setForm({
          title: res.data.title,
          location: res.data.location,
          price: res.data.price,
          description: res.data.description || ""
        });
      } catch {
        setError("Failed to load property");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async e => {
    e.preventDefault();
    setError("");

    try {
      await api.patch(`/properties/${id}`, {
        ...form,
        price: Number(form.price)
      });

      navigate("/my-properties");
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to update property"
      );
    }
  };

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="p-10 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-6">Edit Property</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={submit} className="space-y-4">
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          className="input"
          placeholder="Title"
          required
        />

        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          className="input"
          placeholder="Location"
          required
        />

        <input
          type="number"
          name="price"
          value={form.price}
          onChange={handleChange}
          className="input"
          placeholder="Price"
          required
        />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="input"
          placeholder="Description"
        />

        <button className="btn-primary w-full">
          Save Changes
        </button>
      </form>
    </div>
  );
}

export default EditProperty;
