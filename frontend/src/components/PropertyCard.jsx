import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

function PropertyCard({ property }) {
  const isJustSold = property.just_sold === true;

  /* ===============================
     SAFETY NORMALIZATION (UNCHANGED)
  =============================== */
  const title =
    property.title ||
    property.name ||
    "Untitled Listing";

  const location =
    property.location ||
    property.address ||
    "Location not specified";

  const price = Number(
    property.price ||
      property.amount ||
      0
  );

  const category =
    property.category ||
    property.property_type ||
    property.type ||
    "listing";

  /* ===============================
     IMAGE STATE (UNCHANGED)
  =============================== */
  const [image, setImage] = useState(
    property.image ||
      property.thumbnail ||
      property.images?.[0] ||
      null
  );

  /* ===============================
     ⭐ RATING STATE (NEW)
  =============================== */
  const [ratingStats, setRatingStats] = useState(null);

  useEffect(() => {
    if (image || !property?.id) return;

    let isMounted = true;

    const loadImage = async () => {
      try {
        const res = await api.get(`/images/${property.id}`);

        if (
          isMounted &&
          Array.isArray(res.data) &&
          res.data.length > 0
        ) {
          setImage(res.data[0].image_url);
        }
      } catch {}
    };

    loadImage();
    return () => (isMounted = false);
  }, [property.id, image]);

  /* ===============================
     ⭐ LOAD SELLER RATING (NEW)
  =============================== */
  useEffect(() => {
    if (!property?.owner_id) return;

    let mounted = true;

    const loadRating = async () => {
      try {
        const res = await api.get(
          `/reviews/${property.owner_id}`
        );

        if (mounted) {
          setRatingStats(res.data.stats);
        }
      } catch {
        if (mounted) setRatingStats(null);
      }
    };

    loadRating();
    return () => {
      mounted = false;
    };
  }, [property.owner_id]);

  const finalImage =
    image ||
    "https://via.placeholder.com/400x250?text=No+Image";

  return (
  <Link
    to={isJustSold ? "#" : `/properties/${property.id}`}
    onClick={(e) => {
      if (isJustSold) e.preventDefault();
    }}
    className={`relative card overflow-hidden transition block rounded-lg border bg-white ${
      isJustSold
        ? "opacity-70 cursor-not-allowed"
        : "hover:shadow-lg"
    }`}
  >
    {isJustSold && (
  <div className="absolute top-3 right-3 z-20 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
    Just Sold
  </div>
)}

    {isJustSold && (
  <div className="absolute inset-0 z-10 bg-black bg-opacity-40 flex items-center justify-center rounded-lg">
    <span className="text-white text-lg font-semibold">
      Sold
    </span>
  </div>
)}

      {/* IMAGE */}
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
        <img
          src={finalImage}
          alt={title}
          className="max-w-full max-h-full !object-contain"
        />
      </div>

      {/* CONTENT */}
      <div className="p-4">
        <h3 className="font-semibold text-lg truncate">
          {title}
        </h3>

        <p className="text-sm text-gray-500">
          {location}
        </p>

        {/* ⭐ RATING DISPLAY */}
        <div className="mt-1 text-sm text-yellow-600">
          {ratingStats &&
          Number(ratingStats.total_reviews) > 0 ? (
            <>
              ⭐ {ratingStats.average_rating}{" "}
              <span className="text-gray-500">
                ({ratingStats.total_reviews})
              </span>
            </>
          ) : (
            <span className="text-gray-400">
              No reviews yet
            </span>
          )}
        </div>

        <p className="mt-3 text-blue-600 font-bold">
          ₦{price.toLocaleString()}
        </p>

        {property.revenue_type === "commission" && (
          <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
            Negotiation
          </span>
        )}

        {property.revenue_type === "escrow" && (
          <span className="inline-block mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
            Escrow Protected
          </span>
        )}

        <span className="block mt-2 text-xs text-gray-500 capitalize">
          {category.toString().replace(/_/g, " ")}
        </span>
      </div>
    </Link>
  );
}

export default PropertyCard;
