import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";
import { LOCATIONS } from "../utils/locations";
import { SERVICES } from "../utils/services";

function RequestServiceProvider() {
  const navigate = useNavigate();

  /* ===============================
     SERVICE USAGE (NEW – SAFE)
  =============================== */
  const [usage, setUsage] = useState({ used: 0, max: 2 });

  useEffect(() => {
    const loadUsage = async () => {
      try {
        const res = await api.get("/services/usage");
        setUsage(res.data);
      } catch (err) {
        console.error("Failed to load service usage", err);
      }
    };

    loadUsage();
  }, []);

  /* ===============================
     FORM STATE (UNCHANGED)
  =============================== */
  const [services, setServices] = useState([
    {
      category: "",
      description: "",
      location: "",
      phone: "",
      whatsapp: "",
      images: [],
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ===============================
     HELPERS
  =============================== */
  const addService = () => {
    if (usage.used + services.length >= usage.max) return;

    setServices([
      ...services,
      {
        category: "",
        description: "",
        location: "",
        phone: "",
        whatsapp: "",
        images: [],
      },
    ]);
  };

  const updateService = (index, field, value) => {
    const copy = [...services];
    copy[index][field] = value;
    setServices(copy);
  };

  /* ===============================
     SUBMIT (MATCHES BACKEND)
  =============================== */
  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      services.some(
        (s) => !s.category || !s.description || !s.location
      )
    ) {
      return setError("All service fields are required");
    }

    if (services.some((s) => s.images.length === 0)) {
      return setError("Each service must have at least one image");
    }

    if (usage.used + services.length > usage.max) {
      return setError(
        `You have reached the maximum of ${usage.max} services allowed`
      );
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append(
        "services",
        JSON.stringify(
          services.map(({ images, ...rest }) => rest)
        )
      );

      services.forEach((service, index) => {
        service.images.forEach((img) => {
          formData.append(
            `service_${index + 1}_images`,
            img
          );
        });
      });

      await api.post("/services/request", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/my-services", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Service request failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">
        Become a Service Provider
      </h1>

      {error && (
        <p className="text-red-600 mb-4">{error}</p>
      )}

      <form
        onSubmit={submit}
        className="space-y-6 max-w-xl"
      >
        {services.map((s, i) => (
          <div key={i} className="border p-4 rounded">
            <h3 className="font-semibold mb-2">
              Service {i + 1}
            </h3>

            <select
              className="input"
              value={s.category}
              onChange={(e) =>
                updateService(i, "category", e.target.value)
              }
            >
              <option value="">Select Service</option>
              {SERVICES.map((svc) => (
                <option key={svc} value={svc}>
                  {svc}
                </option>
              ))}
            </select>

            <textarea
              className="input mt-2"
              placeholder="Describe your service"
              value={s.description}
              onChange={(e) =>
                updateService(i, "description", e.target.value)
              }
            />

            <select
              className="input mt-2"
              value={s.location}
              onChange={(e) =>
                updateService(i, "location", e.target.value)
              }
            >
              <option value="">Select location</option>
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>

            <input
              className="input mt-2"
              placeholder="Phone"
              value={s.phone}
              onChange={(e) =>
                updateService(i, "phone", e.target.value)
              }
            />

            <input
              className="input mt-2"
              placeholder="WhatsApp"
              value={s.whatsapp}
              onChange={(e) =>
                updateService(i, "whatsapp", e.target.value)
              }
            />

            <input
              type="file"
              multiple
              accept="image/*"
              className="mt-3"
              onChange={(e) => {
                const files = Array.from(e.target.files);
                if (files.length > 5) {
                  alert("Maximum of 5 images allowed");
                  e.target.value = null;
                  return;
                }
                updateService(i, "images", files);
              }}
            />

            <p className="text-xs text-gray-500 mt-1">
              {s.images.length}/5 images selected
            </p>
          </div>
        ))}

        {usage.used + services.length < usage.max && (
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
