import { useEffect, useState } from "react";
import api from "../../api/axios";

function HouseForm({ propertyId, onSuccess }) {
  const [bedrooms, setBedrooms] = useState("");
  const [houseType, setHouseType] = useState("");
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/details/house/${propertyId}`)
      .then(res => {
        setBedrooms(res.data.bedrooms || "");
        setHouseType(res.data.house_type || "");
        setExists(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [propertyId]);

  const submit = async e => {
    e.preventDefault();

    const payload = {
      property_id: propertyId,
      bedrooms,
      house_type: houseType
    };

    if (exists) {
      await api.put(`/details/house/${propertyId}`, payload);
    } else {
      await api.post("/details/house", payload);
    }

    onSuccess();
  };

  if (loading) return <p>Loading details...</p>;

  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        className="input"
        placeholder="Number of bedrooms"
        value={bedrooms}
        onChange={e => setBedrooms(e.target.value)}
        required
      />

      <input
        className="input"
        placeholder="House type (e.g. Duplex)"
        value={houseType}
        onChange={e => setHouseType(e.target.value)}
      />

      <button className="btn-primary w-full">
        {exists ? "Update Details" : "Save Details"}
      </button>
    </form>
  );
}

export default HouseForm;
