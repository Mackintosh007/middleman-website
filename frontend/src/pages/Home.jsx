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
  { label: "Fashion & Wears", value: "fashion" },
  { label: "Furniture", value: "furniture" },
  { label: "Building Materials", value: "building_materials" },
];


function Home() {
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
    <>
      {/* ================= HERO ================= */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            <span className="block text-lg md:text-xl font-bold text-gray-700 mb-3">
              Omoku and ONELGA Marketplace
            </span>

            Buy, Sell & Rent Safely — <br />
            <span className="text-blue-600">
              Properties, Cars , clothings & Gadgets
            </span>
          </h1>

          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            A trusted marketplace with escrow protection,
            verified sellers, and direct WhatsApp negotiation
            when needed.
          </p>

          {/* SEARCH BAR */}
          <div className="mt-10 max-w-3xl mx-auto bg-gray-50 p-4 rounded-xl border">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              {/* LOCATION */}
              <select
                className="w-full px-3 py-2 border rounded-lg bg-white cursor-pointer"
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
              >
                <option value="">All locations</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>

              {/* CATEGORY */}
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

              {/* MAX PRICE */}
              <input
                type="number"
                placeholder="Max price"
                className="w-full px-3 py-2 border rounded-lg"
                value={maxPrice}
                onChange={(e) =>
                  setMaxPrice(e.target.value)
                }
              />

              <button className="btn-primary">
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ================= LISTINGS ================= */}
      <PageWrapper>
        <h2 className="text-2xl font-semibold mb-6">
          Latest Listings
        </h2>

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
    </>
  );
}

export default Home;
