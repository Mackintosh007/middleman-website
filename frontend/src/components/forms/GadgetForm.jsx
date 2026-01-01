import { useEffect, useState } from "react";
import api from "../../api/axios";

function GadgetForm({ propertyId, onSuccess }) {
  const [form, setForm] = useState({
    brand: "",
    model: "",
    condition: "",
    warranty: ""
  });

  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/details/gadget/${propertyId}`)
      .then(res => {
        setForm({
          brand: res.data.brand || "",
          model: res.data.model || "",
          condition: res.data.condition || "",
          warranty: res.data.warranty || ""
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
      await api.put(`/details/gadget/${propertyId}`, payload);
    } else {
      await api.post("/details/gadget", payload);
    }

    onSuccess();
  };

  if (loading) return <p>Loading details...</p>;

  return (
    <form onSubmit={submit} className="space-y-4">
      <input name="brand" placeholder="Brand" className="input" value={form.brand} onChange={handleChange} required />
      <input name="model" placeholder="Model" className="input" value={form.model} onChange={handleChange} required />

      <select name="condition" className="input" value={form.condition} onChange={handleChange} required>
        <option value="">Condition</option>
        <option value="new">New</option>
        <option value="used">Used</option>
        <option value="refurbished">Refurbished</option>
      </select>

      <input name="warranty" placeholder="Warranty" className="input" value={form.warranty} onChange={handleChange} />

      <button className="btn-primary w-full">
        {exists ? "Update Details" : "Save Details"}
      </button>
    </form>
  );
}

export default GadgetForm;
