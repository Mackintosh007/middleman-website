import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";
import EscrowBuyButton from "../components/EscrowBuyButton";
import WhatsAppCTA from "../components/WhatsAppCTA";
import { useAuth } from "../context/AuthContext";

function PropertyDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]); // ✅ ADD
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await api.get(`/properties/${id}`);
        setProperty(res.data);

        // ✅ ADD: load extra images (non-breaking)
        try {
          const imgRes = await api.get(
            `/properties/${id}/images`
          );
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
  const isOwner = user && user.id === property.owner_id;
  const isActive = property.status === "active";

  const showEscrowCTA =
    property.revenue_type === "escrow" &&
    !isOwner &&
    isActive;

  const showWhatsAppCTA =
    property.revenue_type === "commission" &&
    !isOwner &&
    isActive;

  return (
    <PageWrapper>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* IMAGE SECTION */}
        <div>
          {/* MAIN IMAGE (UNCHANGED) */}
          <img
            src={
              property.image ||
              "https://via.placeholder.com/600x400?text=No+Image"
            }
            alt={property.title}
            className="w-full h-96 object-cover rounded-lg"
          />

          {/* ✅ ADD: IMAGE GALLERY */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {images.map((img) => (
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

          {/* BADGES (UNCHANGED) */}
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

          {/* CTA SECTION (UNCHANGED) */}
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
  );
}

export default PropertyDetails;
