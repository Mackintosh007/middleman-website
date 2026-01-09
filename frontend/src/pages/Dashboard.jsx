import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageWrapper from "../components/PageWrapper";
import SellerRequestCard from "../components/SellerRequestCard";

function Dashboard() {
  const { user, loading } = useAuth();

  // 🔐 Still loading auth state
  if (loading) {
    return (
      <PageWrapper>
        <p>Loading dashboard...</p>
      </PageWrapper>
    );
  }

  // 🔐 Not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  // ✅ SAFE ROLE DISPLAY
  const roleLabel = user.role
    ? user.role.replace("_", " ")
    : "user";

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold">
        Dashboard
      </h1>

      <p className="mt-4 text-gray-600">
        Logged in as <strong>{roleLabel}</strong>
      </p>

      {/* ===============================
          ACCOUNT ACTIONS
      =============================== */}
      <div className="mt-4 space-y-2">
        <Link
          to="/profile/edit"
          className="block text-blue-600 underline"
        >
          Edit Profile
        </Link>

        <Link
          to="/verify-phone"
          className="block text-blue-600 underline"
        >
          Verify Phone Number
        </Link>

        {/* ✅ NEW: SERVICES DASHBOARD LINK */}
        <Link
          to="/my-services"
          className="block text-blue-600 underline"
        >
          My Services
        </Link>
      </div>

      {/* ===============================
          CUSTOMER
      =============================== */}
      {user.role === "customer" && (
        <>
          <SellerRequestCard />

          <Link
            to="/orders"
            className="block mt-4 text-blue-600 underline"
          >
            My Orders
          </Link>
        </>
      )}

      {/* ===============================
          SELLER / AGENT
      =============================== */}
      {(user.role === "agent" ||
        user.role === "individual_seller") && (
        <>
          <Link
            to="/my-properties"
            className="block mt-6 text-blue-600 underline"
          >
            View My Listings
          </Link>

          <Link
            to="/create-property"
            className="block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
          >
            ➕ Add New Listing
          </Link>

          <Link
            to="/orders"
            className="block mt-3 text-blue-600 underline"
          >
            Orders on My Listings
          </Link>
       
          <Link
            to="/wallet"
            className="block mt-3 text-blue-600 underline"
          >
            Wallet & Withdrawals
          </Link>

          {/* ✅ SAFE ADDITION — DOES NOT AFFECT EXISTING LOGIC */}
          <Link
            to="/withdraw"
            className="block mt-2 text-blue-600 underline"
          >
            Request Withdrawal
          </Link>
        </>
      )}

      {/* ===============================
          ADMIN
      =============================== */}
      {user.role === "admin" && (
        <Link
          to="/admin"
          className="block mt-6 text-red-600 underline"
        >
          Go to Admin Dashboard
        </Link>
      )}
    </PageWrapper>
  );
}

export default Dashboard;
