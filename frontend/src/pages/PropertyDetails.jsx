import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";
import EscrowBuyButton from "../components/EscrowBuyButton";
import WhatsAppCTA from "../components/WhatsAppCTA";
import { useAuth } from "../context/AuthContext";
import SEO from "../components/SEO";

function PropertyDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await api.get(`/properties/${id}`);
        setProperty(res.data);

        // ✅ FIX: correct images endpoint
        try {
          const imgRes = await api.get(`/images/${id}`);
          setImages(imgRes.data || []);
        } catch {
          setImages([]);
        }
      } catch (err) {
        console.error("Failed to load property", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <PageWrapper>
        <p>Loading property...</p>
      </PageWrapper>
    );
  }

  if (!property) {
    return (
      <PageWrapper>
        <p>Property not found.</p>
      </PageWrapper>
    );
  }

  /* ===============================
     CTA RULES (UNCHANGED)
  =============================== */
  const isOwner = user && Number(user.id) === Number(property.owner_id);
  const isActive = property.status === "active";

  const showEscrowCTA =
    property.revenue_type === "escrow" &&
    !isOwner &&
    isActive;

  const showWhatsAppCTA =
    property.revenue_type === "commission" &&
    !isOwner &&
    isActive;

  // ✅ FIX: derive main image from uploaded images
  const mainImage =
    images.length > 0
      ? images[0].image_url
      : "https://via.placeholder.com/600x400?text=No+Image";

  return (
    <>
      <SEO
        title={`${property.title} | Middleman`}
        description={property.description?.slice(0, 150)}
        url={`https://middlemanng.com/properties/${property.id}`}
      />

      <PageWrapper>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* IMAGE SECTION */}
          <div>
            {/* MAIN IMAGE */}
            <img
              src={mainImage}
              alt={property.title}
              className="w-full h-96 object-cover rounded-lg"
            />

            {/* IMAGE GALLERY */}
            {images.length > 1 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {images.slice(1).map((img) => (
                  <img
                    key={img.id}
                    src={img.image_url}
                    alt={property.title}
                    className="h-28 w-full object-cover rounded border cursor-pointer hover:opacity-80"
                  />
                ))}
              </div>
            )}
          </div>

          {/* DETAILS */}
          <div>
            <h1 className="text-3xl font-bold">
              {property.title}
            </h1>

            <p className="mt-2 text-gray-600">
              {property.location}
            </p>

            <p className="mt-4 text-2xl font-bold text-blue-600">
              ₦{Number(property.price).toLocaleString()}
            </p>

            <p className="mt-6 text-gray-700">
              {property.description}
            </p>

            <div className="mt-4 flex gap-2">
              {property.revenue_type === "escrow" && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Escrow Protected
                </span>
              )}

              {property.revenue_type === "commission" && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  Negotiation
                </span>
              )}
            </div>

            <div className="mt-8">
              {showEscrowCTA && (
                <EscrowBuyButton property={property} />
              )}

              {showWhatsAppCTA && (
                <WhatsAppCTA property={property} />
              )}

              {isOwner && (
                <p className="text-sm text-gray-500">
                  You own this listing.
                </p>
              )}

              {!isActive && (
                <p className="text-sm text-red-500">
                  This listing is not active.
                </p>
              )}
            </div>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}

export default PropertyDetails;
