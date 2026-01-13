import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageWrapper from "../components/PageWrapper";
import SellerRequestCard from "../components/SellerRequestCard";
import { useEffect, useState } from "react";
import api from "../api/axios";

function Dashboard() {
  const { user, loading } = useAuth();

  const [servicesCount, setServicesCount] = useState(0);
  const [pendingActions, setPendingActions] = useState(null);
  const [loadingServices, setLoadingServices] = useState(true);

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

  /* ===============================
     LOAD USER SERVICES COUNT
     (READ-ONLY, SAFE)
  =============================== */
  useEffect(() => {
    api
      .get("/services/mine")
      .then(res => {
        if (Array.isArray(res.data)) {
          setServicesCount(res.data.length);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingServices(false));
  }, []);
  /* ===============================
   LOAD PENDING ACTIONS
   (SAFE, READ-ONLY)
=============================== */
  useEffect(() => {
    api
      .get("/orders/pending-actions")
      .then(res => setPendingActions(res.data))
      .catch(() => {});
  }, []);

  const roleLabel = user.role
    ? user.role.replace("_", " ")
    : "user";

  const reachedServiceLimit = servicesCount >= 2;

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {/* ===============================
    PENDING ACTION NOTIFICATIONS
=============================== */}
      {pendingActions?.seller_pending > 0 && (
        <div className="mt-4 p-4 rounded bg-yellow-100 text-yellow-800">
          🚚 You have {pendingActions.seller_pending} paid order(s) awaiting delivery.
          Please mark them as delivered.
        </div>
      )}

      {pendingActions?.buyer_pending > 0 && (
        <div className="mt-4 p-4 rounded bg-blue-100 text-blue-800">
          📦 You have {pendingActions.buyer_pending} delivered order(s) awaiting confirmation.
        </div>
      )}


      <p className="mt-4 text-gray-600">
        Logged in as <strong>{roleLabel}</strong>
      </p>

      {/* ===============================
          ACCOUNT ACTIONS
      =============================== */}
      <div className="mt-4 space-y-2">
        <Link to="/profile/edit" className="block text-blue-600 underline">
          Edit Profile
        </Link>

        <Link to="/verify-phone" className="block text-blue-600 underline">
          Verify Phone Number
        </Link>

        <Link to="/my-services" className="block text-blue-600 underline">
          My Services
        </Link>
      </div>

      {/* ===============================
          SERVICE PROVIDER CTA
          (CUSTOMER + SELLER)
      =============================== */}
      {user.role !== "admin" && (
        <div
          className={`mt-8 p-6 rounded-xl ${
            reachedServiceLimit
              ? "bg-gray-100 border border-gray-300"
              : "bg-gradient-to-r from-indigo-600 to-blue-600 text-white"
          }`}
        >
          <h3
            className={`text-xl font-bold mb-2 ${
              reachedServiceLimit ? "text-gray-700" : ""
            }`}
          >
            Become a Service Provider
          </h3>

          <p
            className={`text-sm mb-4 ${
              reachedServiceLimit
                ? "text-gray-600"
                : "text-blue-100"
            }`}
          >
            {reachedServiceLimit
              ? "You have reached the maximum of 2 services allowed per account."
              : "Offer your skills, get hired by local clients, and grow your income on Middleman."}
          </p>

          {loadingServices ? (
            <p className="text-sm text-gray-500">
              Checking service slots…
            </p>
          ) : reachedServiceLimit ? (
            <button
              disabled
              className="bg-gray-300 text-gray-600 px-6 py-3 rounded-lg font-semibold cursor-not-allowed"
            >
              Service limit reached (2 / 2)
            </button>
          ) : (
            <Link
              to="/service-requests"
              className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50"
            >
              Apply as Service Provider ({servicesCount}/2 used)
            </Link>
          )}
        </div>
      )}

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
