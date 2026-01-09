import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";
import SEO from "../components/SEO";

function ServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate("/services", { replace: true });
      return;
    }

    let mounted = true;

    const fetchService = async () => {
      try {
        const res = await api.get(`/services/${id}`);
        if (!mounted) return;

        setService(res.data);
        setImages(res.data.images || []);
      } catch (err) {
        if (err.response?.status === 404) {
          navigate("/services", { replace: true });
          return;
        }

        console.error("Failed to load service", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchService();
    return () => (mounted = false);
  }, [id, navigate]);

  if (loading) {
    return (
      <PageWrapper>
        <p>Loading service...</p>
      </PageWrapper>
    );
  }

  if (!service) {
    return (
      <PageWrapper>
        <p>Service not found.</p>
      </PageWrapper>
    );
  }

  const mainImage =
    images.length > 0
      ? images[0].image_url
      : "https://via.placeholder.com/600x400?text=Service";

  return (
    <>
      <SEO
        title={`${service.category} | Middleman Services`}
        description={service.description?.slice(0, 150)}
        url={`https://middlemanng.com/services/${service.id}`}
      />

      <PageWrapper>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* ================= IMAGE SECTION ================= */}
          <div>
            <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              <img
                src={mainImage}
                alt={service.category}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {images.slice(1).map((img) => (
                  <div
                    key={img.id}
                    className="h-28 bg-gray-100 rounded border flex items-center justify-center overflow-hidden"
                  >
                    <img
                      src={img.image_url}
                      alt={service.category}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ================= DETAILS ================= */}
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {service.category}
            </h1>

            <p className="text-gray-600 mb-4">
              {service.location}
            </p>

            <p className="text-gray-700 mb-6">
              {service.description}
            </p>

            <div className="flex gap-3 mb-6">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Verified Service
              </span>
            </div>

            {/* ================= CTA ================= */}
            <div className="flex gap-4">
              <a
                href={`https://wa.me/${service.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded"
              >
                Chat on WhatsApp
              </a>

              <a
                href={`tel:${service.phone}`}
                className="bg-gray-200 hover:bg-gray-300 px-6 py-3 rounded"
              >
                Call
              </a>
            </div>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}

export default ServiceDetails;
