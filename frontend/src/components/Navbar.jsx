import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true }); // ✅ prevent back-button issues
  };

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* LOGO */}
        <Link
          to="/"
          className="text-xl font-bold text-blue-600"
        >
          Middleman
        </Link>

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
              {/* ✅ ALWAYS go to /dashboard */}
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
    </header>
  );
}

export default Navbar;
