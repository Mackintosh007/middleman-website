import { Link } from "react-router-dom";

function PropertyCard({ property }) {
  // 🔒 SAFETY NORMALIZATION
  const title =
    property.title ||
    property.name ||
    "Untitled Listing";

  const image =
    property.image ||
    property.thumbnail ||
    property.images?.[0] ||
    "https://via.placeholder.com/400x250?text=No+Image";

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

  return (
    <Link
      to={`/properties/${property.id}`}
      className="card overflow-hidden hover:shadow-lg transition block bg-white rounded-lg border"
    >
      {/* IMAGE */}
      <img
        src={image}
        alt={title}
        className="w-full h-48 object-cover"
      />

      {/* CONTENT */}
      <div className="p-4">
        {/* TITLE */}
        <h3 className="font-semibold text-lg truncate">
          {title}
        </h3>

        {/* LOCATION */}
        <p className="text-sm text-gray-500">
          {location}
        </p>

        {/* PRICE */}
        <p className="mt-3 text-blue-600 font-bold">
          ₦{price.toLocaleString()}
        </p>

        {/* 🔹 REVENUE TYPE BADGE */}
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

        {/* CATEGORY */}
        <span className="block mt-2 text-xs text-gray-500 capitalize">
          {category.toString().replace(/_/g, " ")}
        </span>
      </div>
    </Link>
  );
}

export default PropertyCard;
