import { useEffect, useState } from "react";
import api from "../../api/axios";

function AutomobileForm({ propertyId, onSuccess }) {
  const [form, setForm] = useState({
    brand: "",
    model: "",
    year: "",
    mileage: ""
  });

  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/details/car/${propertyId}`)
      .then(res => {
        setForm({
          brand: res.data.brand || "",
          model: res.data.model || "",
          year: res.data.year || "",
          mileage: res.data.mileage || ""
        });
        setExists(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [propertyId]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async e => {
    e.preventDefault();

    const payload = {
      property_id: propertyId,
      ...form
    };

    if (exists) {
      await api.put(`/details/car/${propertyId}`, payload);
    } else {
      await api.post("/details/car", payload);
    }

    onSuccess();
  };

  if (loading) return <p>Loading details...</p>;

  return (
    <form onSubmit={submit} className="space-y-4">
      <input name="brand" placeholder="Brand" className="input" value={form.brand} onChange={handleChange} required />
      <input name="model" placeholder="Model" className="input" value={form.model} onChange={handleChange} required />
      <input name="year" type="number" placeholder="Year" className="input" value={form.year} onChange={handleChange} required />
      <input name="mileage" type="number" placeholder="Mileage (km)" className="input" value={form.mileage} onChange={handleChange} />

      <button className="btn-primary w-full">
        {exists ? "Update Details" : "Save Details"}
      </button>
    </form>
  );
}

export default AutomobileForm;
