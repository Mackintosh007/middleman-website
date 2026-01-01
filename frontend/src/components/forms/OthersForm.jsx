import { useEffect, useState } from "react";
import api from "../../api/axios";

function OthersForm({ propertyId, onSuccess }) {
  const [details, setDetails] = useState("");
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/details/others/${propertyId}`)
      .then(res => {
        setDetails(res.data.details || "");
        setExists(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [propertyId]);

  const submit = async e => {
    e.preventDefault();

    const payload = {
      property_id: propertyId,
      details
    };

    if (exists) {
      await api.put(`/details/others/${propertyId}`, payload);
    } else {
      await api.post("/details/others", payload);
    }

    onSuccess();
  };

  if (loading) return <p>Loading details...</p>;

  return (
    <form onSubmit={submit} className="space-y-4">
      <textarea
        className="input"
        placeholder="Describe this item"
        value={details}
        onChange={e => setDetails(e.target.value)}
        required
      />

      <button className="btn-primary w-full">
        {exists ? "Update Details" : "Save Details"}
      </button>
    </form>
  );
}

export default OthersForm;
