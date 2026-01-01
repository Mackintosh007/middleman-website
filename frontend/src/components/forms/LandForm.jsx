import { useEffect, useState } from "react";
import api from "../../api/axios";

function LandForm({ propertyId, onSuccess }) {
  const [size, setSize] = useState("");
  const [location, setLocation] = useState("");
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔁 Load existing details if any
  useEffect(() => {
    api
      .get(`/details/land/${propertyId}`)
      .then(res => {
        setSize(res.data.size || "");
        setLocation(res.data.location || "");
        setExists(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [propertyId]);

  const submit = async e => {
    e.preventDefault();

    const payload = {
      property_id: propertyId,
      size,
      location
    };

    if (exists) {
      await api.put(`/details/land/${propertyId}`, payload);
    } else {
      await api.post("/details/land", payload);
    }

    onSuccess();
  };

  if (loading) return <p>Loading details...</p>;

  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        className="input"
        placeholder="Land size"
        value={size}
        onChange={e => setSize(e.target.value)}
        required
      />

      <input
        className="input"
        placeholder="Location"
        value={location}
        onChange={e => setLocation(e.target.value)}
        required
      />

      <button className="btn-primary w-full">
        {exists ? "Update Details" : "Save Details"}
      </button>
    </form>
  );
}

export default LandForm;
