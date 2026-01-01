import { useEffect, useState } from "react";
import api from "../../api/axios";

function ApartmentForm({ propertyId, onSuccess }) {
  const [bedrooms, setBedrooms] = useState("");
  const [apartmentType, setApartmentType] = useState("");
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/details/apartment/${propertyId}`)
      .then(res => {
        setBedrooms(res.data.bedrooms || "");
        setApartmentType(res.data.apartment_type || "");
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
      apartment_type: apartmentType
    };

    if (exists) {
      await api.put(`/details/apartment/${propertyId}`, payload);
    } else {
      await api.post("/details/apartment", payload);
    }

    onSuccess();
  };

  if (loading) return <p>Loading details...</p>;

  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        className="input"
        placeholder="Bedrooms"
        value={bedrooms}
        onChange={e => setBedrooms(e.target.value)}
        required
      />

      <input
        className="input"
        placeholder="Apartment type (e.g. Studio)"
        value={apartmentType}
        onChange={e => setApartmentType(e.target.value)}
      />

      <button className="btn-primary w-full">
        {exists ? "Update Details" : "Save Details"}
      </button>
    </form>
  );
}

export default ApartmentForm;
