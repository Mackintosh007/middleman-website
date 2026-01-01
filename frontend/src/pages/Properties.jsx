import { useEffect, useState } from "react";
import api from "../api/axios";
import PropertyCard from "../components/PropertyCard";
import PageWrapper from "../components/PageWrapper";
import { LOCATIONS } from "../utils/locations";

const CATEGORIES = [
  { label: "All", value: "all" },
  { label: "Land", value: "land" },
  { label: "House", value: "house" },
  { label: "Apartment", value: "apartment" },
  { label: "Automobile", value: "automobile" },
  { label: "Gadgets", value: "gadget" },
  { label: "Equipment", value: "equipment" },
  { label: "Others", value: "others" },
];

function Properties() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await api.get("/properties");

        // 🔒 DEFENSIVE NORMALIZATION
        if (Array.isArray(res.data)) {
          setListings(res.data);
        } else if (Array.isArray(res.data?.results)) {
          setListings(res.data.results);
        } else {
          setListings([]);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load listings");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const filteredListings = listings.filter((item) => {
    if (!item) return false;

    if (
      category !== "all" &&
      item.property_type !== category
    ) {
      return false;
    }

    if (location && item.location !== location) {
      return false;
    }

    if (
      maxPrice &&
      Number(item.price) > Number(maxPrice)
    ) {
      return false;
    }

    return true;
  });

  return (
    <PageWrapper>
      <h1 className="text-2xl font-semibold mb-2">
        Listings
      </h1>
      <p className="text-gray-600 mb-6">
        Browse all available listings on the marketplace.
      </p>

      {/* ================= FILTER BAR ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* LOCATION */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Location
          </label>
          <select
            className="w-full px-3 py-2 border rounded-lg bg-white cursor-pointer"
            value={location}
            onChange={(e) =>
              setLocation(e.target.value)
            }
          >
            <option value="">All</option>
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* CATEGORY */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Category
          </label>
          <select
            className="w-full px-3 py-2 border rounded-lg bg-white cursor-pointer"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* MAX PRICE */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Max price
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border rounded-lg"
            value={maxPrice}
            onChange={(e) =>
              setMaxPrice(e.target.value)
            }
            placeholder="Any"
          />
        </div>

        {/* BUTTON */}
        <div className="flex items-end">
          <button
            type="button"
            className="btn-primary w-full"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* ================= CATEGORY PILLS ================= */}
      <div className="flex flex-wrap gap-3 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() =>
              setCategory(cat.value)
            }
            className={`px-4 py-2 rounded-full text-sm border ${
              category === cat.value
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ================= LISTINGS ================= */}
      {loading ? (
        <p className="text-gray-500">
          Loading listings…
        </p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : filteredListings.length === 0 ? (
        <p className="text-gray-500">
          No listings found.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((item) => (
            <PropertyCard
              key={item.id}
              property={item}
            />
          ))}
        </div>
      )}
    </PageWrapper>
  );
}

export default Properties;
