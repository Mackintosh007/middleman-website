import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";
import SEO from "../components/SEO";
import { LOCATIONS } from "../utils/locations";
import { SERVICES } from "../utils/services"; // ✅ your new list

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");

  const fetchServices = async () => {
    try {
      setLoading(true);

      const res = await api.get("/services", {
        params: {
          location: location || undefined,
          category: category || undefined,
        },
      });

      setServices(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [location, category]);

  return (
    <PageWrapper>
      <SEO
        title="Find Local Services | Middleman"
        description="Find trusted service providers in Omoku and ONELGA"
        url="https://middlemanng.com/services"
      />

      <h1 className="text-3xl font-bold mb-4">
        Find Services
      </h1>

      <p className="text-gray-600 mb-6">
        Browse trusted service providers around Omoku & ONELGA.
      </p>

      {/* ===============================
          FILTERS
      =============================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-2xl">
        <select
          className="input"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          <option value="">All Locations</option>
          {LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Services</option>
          {SERVICES.map((svc) => (
            <option key={svc} value={svc}>
              {svc}
            </option>
          ))}
        </select>
      </div>

      {/* ===============================
          RESULTS
      =============================== */}
      {loading && <p>Loading services...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && services.length === 0 && (
        <p className="text-gray-500">
          No services found for selected filters.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div
            key={service.id}
            className="border rounded-lg bg-white shadow-sm overflow-hidden"
          >
            {/* IMAGE */}
            <div className="h-48 bg-gray-100 flex items-center justify-center">
              <img
                src={
                  service.image ||
                  "https://via.placeholder.com/400x250?text=Service"
                }
                alt={service.category}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* CONTENT */}
            <div className="p-4">
              <h3 className="font-semibold text-lg">
                {service.category}
              </h3>

              <p className="text-sm text-gray-600 mt-1">
                {service.location}
              </p>

              <p className="text-sm mt-2 text-gray-700 line-clamp-3">
                {service.description}
              </p>

              <p className="text-sm mt-3 text-gray-500">
                Provider: {service.first_name || "Verified Provider"}
              </p>

              {/* ACTIONS */}
              <div className="mt-4 flex gap-2">
                <a
                  href={`tel:${service.phone}`}
                  className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded"
                >
                  Call
                </a>

                <a
                  href={`https://wa.me/${service.whatsapp.replace(
                    /\D/g,
                    ""
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}

export default Services;
