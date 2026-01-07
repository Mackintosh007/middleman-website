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
} from "lucide-react";

const CATEGORIES = [
  { label: "Land", value: "land", icon: Home },
  { label: "House", value: "house", icon: Building2 },
  { label: "Apartment", value: "apartment", icon: Warehouse },
  { label: "Automobile", value: "car", icon: Car },
  { label: "Gadgets", value: "gadget", icon: Smartphone },
  { label: "Equipment", value: "equipment", icon: Wrench },
  { label: "Fashion", value: "fashion", icon: Shirt },
  { label: "Furniture", value: "furniture", icon: Sofa },
  { label: "Building Materials", value: "building_materials", icon: Hammer },
];

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState("");

  const query = new URLSearchParams(location.search);
  const activeCategory = query.get("category");

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleCategoryClick = (category) => {
    navigate(`/?category=${category}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/?q=${encodeURIComponent(search.trim())}`);
    setSearch("");
  };

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      {/* ===== TOP NAV ===== */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* LOGO */}
        <button
          onClick={() => navigate("/", { replace: true })}
          className="text-xl font-bold text-blue-600"
        >
          Middleman
        </button>


        {/* SEARCH */}
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
          <Link
            to="/properties"
            className="hover:text-blue-600"
          >
            Listings
          </Link>

          {user ? (
            <>
              <Link
                to="/dashboard"
                className="hover:text-blue-600"
              >
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
              <Link
                to="/login"
                className="hover:text-blue-600"
              >
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
        <div className="max-w-7xl mx-auto px-6 py-3 flex gap-6 overflow-x-auto text-sm font-medium">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.value;

            return (
              <button
                key={cat.value}
                onClick={() => handleCategoryClick(cat.value)}
                className={`flex items-center gap-2 whitespace-nowrap pb-1 transition ${
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
        </div>
      </div>
    </header>
  );
}

export default Navbar;
