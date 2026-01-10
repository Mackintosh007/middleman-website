import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";
import { LOCATIONS } from "../utils/locations";
import { SERVICES } from "../utils/services";

function RequestServiceProvider() {
  const navigate = useNavigate();

  const [services, setServices] = useState([
    {
      category: "",
      description: "",
      location: "",
      phone: "",
      whatsapp: "",
      images: []
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addService = () => {
    if (services.length >= 2) return;
    setServices([
      ...services,
      {
        category: "",
        description: "",
        location: "",
        phone: "",
        whatsapp: "",
        images: []
      }
    ]);
  };

  const updateService = (index, field, value) => {
    const copy = [...services];
    copy[index][field] = value;
    setServices(copy);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (services.some(s => !s.category || !s.description || !s.location)) {
      return setError("All service fields are required");
    }

    if (services.some(s => s.images.length === 0)) {
      return setError("Each service must have at least one image");
    }

    const fd = new FormData();
    fd.append("services", JSON.stringify(
      services.map(({ images, ...rest }) => rest)
    ));

    services.forEach((svc, i) => {
      svc.images.forEach(img => {
        fd.append(`service_${i + 1}_images`, img);
      });
    });

    setLoading(true);
    try {
      await api.post("/service-requests", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert("Service request submitted successfully");
      navigate("/my-services");

    } catch (err) {
      setError(err.response?.data?.error || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">
        Become a Service Provider
      </h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={submit} className="space-y-6 max-w-xl">
        {services.map((s, i) => (
          <div key={i} className="border p-4 rounded">
            <h3 className="font-semibold mb-2">
              Service {i + 1}
            </h3>

            <select
              className="input"
              onChange={e =>
                updateService(i, "category", e.target.value)
              }
            >
              <option value="">Select Service</option>
              {SERVICES.map(svc => (
                <option key={svc} value={svc}>{svc}</option>
              ))}
            </select>

            <textarea
              className="input mt-2"
              placeholder="Describe your service"
              onChange={e =>
                updateService(i, "description", e.target.value)
              }
            />

            <select
              className="input mt-2"
              onChange={e =>
                updateService(i, "location", e.target.value)
              }
            >
              <option value="">Select location</option>
              {LOCATIONS.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>

            <input
              className="input mt-2"
              placeholder="Phone"
              onChange={e =>
                updateService(i, "phone", e.target.value)
              }
            />

            <input
              className="input mt-2"
              placeholder="WhatsApp"
              onChange={e =>
                updateService(i, "whatsapp", e.target.value)
              }
            />

            <input
              type="file"
              multiple
              accept="image/*"
              className="mt-3"
              onChange={e =>
                updateService(i, "images", Array.from(e.target.files))
              }
              required
            />
          </div>
        ))}

        {services.length < 2 && (
          <button
            type="button"
            onClick={addService}
            className="text-blue-600 underline"
          >
            + Add another service
          </button>
        )}

        <button disabled={loading} className="btn-primary">
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </PageWrapper>
  );
}

export default RequestServiceProvider;
