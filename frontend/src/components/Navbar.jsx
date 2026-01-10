import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import {
  Home,
  Building2,
  Warehouse,
  Car,
  Smartphone,
  Wrench,
  Shirt,
  Sofa,
  Hammer,
  Briefcase, // ✅ SERVICES ICON
  MoreHorizontal,
  X
} from "lucide-react";

/* ===============================
   PROPERTY CATEGORIES
=============================== */
const PROPERTY_CATEGORIES = [
  { label: "Land", value: "land", icon: Home },
  { label: "House", value: "house", icon: Building2 },
  { label: "Apartment", value: "apartment", icon: Warehouse },
  { label: "Automobile", value: "car", icon: Car },
  { label: "Gadgets", value: "gadget", icon: Smartphone },
  { label: "Equipment", value: "equipment", icon: Wrench },
  { label: "Fashion", value: "fashion", icon: Shirt },
  { label: "Furniture", value: "furniture", icon: Sofa },
  { label: "Building Materials", value: "building_materials", icon: Hammer }
];

/* ===============================
   SERVICES ENTRY (SEPARATE)
=============================== */
const SERVICES_CATEGORY = {
  label: "Services",
  value: "services",
  icon: Briefcase
};

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const query = new URLSearchParams(location.search);
  const activeCategory = query.get("category");

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleCategoryClick = (category) => {
    navigate(`/?category=${category}`);
    setShowAll(false);
  };

  const handleServicesClick = () => {
    navigate("/services");
    setShowAll(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/?q=${encodeURIComponent(search.trim())}`);
    setSearch("");
  };

  // Mobile: first 5 property categories
  const mobileCategories = PROPERTY_CATEGORIES.slice(0, 5);

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      {/* ===== TOP NAV ===== */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <button
          onClick={() => navigate("/", { replace: true })}
          className="text-xl font-bold text-blue-600"
        >
          Middleman
        </button>

        {/* SEARCH (DESKTOP) */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex items-center gap-2 border rounded-lg px-3 py-1"
        >
          <input
            type="text"
            placeholder="Search listings…"
            className="outline-none text-sm w-48"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        {/* NAV LINKS */}
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link to="/properties" className="hover:text-blue-600">
            Listings
          </Link>

          {/* ✅ SERVICES LINK RESTORED */}
          <Link to="/services" className="hover:text-blue-600">
            Services
          </Link>

          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-blue-600">
                Dashboard
              </Link>

              <button
                onClick={handleLogout}
                className="text-red-600 hover:underline"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-600">
                Login
              </Link>

              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* ===== CATEGORY BAR ===== */}
      <div className="bg-white border-t sticky top-[72px] z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm font-medium">

          {/* ===============================
              MOBILE (2-ROW WRAP)
          =============================== */}
          <div className="grid grid-cols-3 gap-3 md:hidden">
            {/* PROPERTY CATEGORIES */}
            {mobileCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.value;

              return (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryClick(cat.value)}
                  className={`flex items-center gap-2 justify-center py-2 rounded-lg ${
                    isActive
                      ? "text-blue-600 border border-blue-600"
                      : "text-gray-600 border"
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-xs">{cat.label}</span>
                </button>
              );
            })}

            {/* ✅ SERVICES BUTTON */}
            <button
              onClick={handleServicesClick}
              className="flex items-center gap-2 justify-center py-2 rounded-lg border text-gray-600"
            >
              <Briefcase size={16} />
              <span className="text-xs">Services</span>
            </button>

            {/* MORE */}
            <button
              onClick={() => setShowAll(true)}
              className="flex items-center gap-2 justify-center py-2 rounded-lg border text-gray-600"
            >
              <MoreHorizontal size={16} />
              <span className="text-xs">More</span>
            </button>
          </div>

          {/* ===============================
              DESKTOP
          =============================== */}
          <div className="hidden md:flex gap-6 items-center">
            {PROPERTY_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.value;

              return (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryClick(cat.value)}
                  className={`flex items-center gap-2 whitespace-nowrap pb-1 ${
                    isActive
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-blue-600"
                  }`}
                >
                  <Icon size={16} />
                  {cat.label}
                </button>
              );
            })}

            {/* ✅ SERVICES (DESKTOP) */}
            <button
              onClick={handleServicesClick}
              className="flex items-center gap-2 whitespace-nowrap pb-1 text-gray-600 hover:text-blue-600"
            >
              <Briefcase size={16} />
              Services
            </button>
          </div>
        </div>
      </div>

      {/* ===== MOBILE MODAL ===== */}
      {showAll && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-end md:hidden">
          <div className="bg-white w-full rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                All Categories
              </h3>
              <button onClick={() => setShowAll(false)}>
                <X />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {PROPERTY_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    onClick={() => handleCategoryClick(cat.value)}
                    className="flex items-center gap-3 border rounded-lg p-3"
                  >
                    <Icon size={18} />
                    {cat.label}
                  </button>
                );
              })}

              {/* ✅ SERVICES IN MODAL */}
              <button
                onClick={handleServicesClick}
                className="flex items-center gap-3 border rounded-lg p-3"
              >
                <Briefcase size={18} />
                Services
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
