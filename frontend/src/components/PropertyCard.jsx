import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

function PropertyCard({ property }) {
  // 🔒 SAFETY NORMALIZATION (UNCHANGED)
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

  // IMAGE STATE (UNCHANGED)
  const [image, setImage] = useState(
    property.image ||
      property.thumbnail ||
      property.images?.[0] ||
      null
  );

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

  const finalImage =
    image ||
    "https://via.placeholder.com/400x250?text=No+Image";

  return (
    <Link
      to={`/properties/${property.id}`}
      className="card overflow-hidden hover:shadow-lg transition block bg-white rounded-lg border"
    >
      {/* IMAGE — FORCE OVERRIDE */}
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
