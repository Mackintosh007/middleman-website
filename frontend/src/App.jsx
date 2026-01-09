import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

/* PUBLIC PAGES */
import Home from "./pages/Home";
import Properties from "./pages/Properties";
import PropertyDetails from "./pages/PropertyDetails";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import SellerProfile from "./pages/SellerProfile";
import VerifyPhone from "./pages/VerifyPhone";
import HowEscrowWorks from "./pages/HowEscrowWorks";
import SellerGuidelines from "./pages/SellerGuidelines";
import TrustAndSupport from "./pages/TrustAndSupport";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Contact from "./pages/Contact";


/* USER */
import Dashboard from "./pages/Dashboard";
import EditProfile from "./pages/EditProfile";
import MyOrders from "./pages/MyOrders";

/* SELLER */
import CreateProperty from "./pages/CreateProperty";
import AddPropertyDetails from "./pages/AddPropertyDetails";
import MyProperties from "./pages/MyProperties";
import Wallet from "./pages/Wallet";
import Withdraw from "./pages/Withdraw";
import VerifyBank from "./pages/VerifyBank";
import VerifyEmail from "./pages/VerifyEmail";
import ResendVerification from "./pages/ResendVerification";
import PaymentSuccess from "./pages/PaymentSuccess";



/* ADMIN */
import AdminDashboard from "./pages/AdminDashboard";
import AdminRevenue from "./pages/AdminRevenue";
import AdminOrders from "./pages/AdminOrders";
import AdminWithdrawals from "./pages/AdminWithdrawals";
import AdminUsers from "./pages/AdminUsers";
import AdminSellerRequests from "./pages/AdminSellerRequests";
import AdminListings from "./pages/AdminListings";
import AdminAuditLogs from "./pages/AdminAuditLogs";





function App() {
  return (
    <>
      {/* ✅ GLOBAL NAVBAR */}
      <Navbar />

      {/* ✅ ROUTES ONLY */}
      <Routes>
        {/* ================= PUBLIC ================= */}
        <Route path="/" element={<Home />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:id" element={<PropertyDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/sellers/:id" element={<SellerProfile />} />
        <Route path="/verify-phone" element={<VerifyPhone />} />
        <Route path="/how-escrow-works" element={<HowEscrowWorks />} />
        <Route path="/seller-guidelines" element={<SellerGuidelines />} />
        <Route path="/trust-support" element={<TrustAndSupport />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/resend-verification" element={<ResendVerification />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:id" element={<ServiceDetails />} />
        <Route path="/services" element={<FindServices />} />





        {/* ================= AUTH ================= */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          }
        />

        {/* ================= SELLER ================= */}
        <Route
          path="/create-property"
          element={
            <ProtectedRoute roles={["admin", "agent", "individual_seller"]}>
              <CreateProperty />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-property-details/:id"
          element={
            <ProtectedRoute roles={["admin", "agent", "individual_seller"]}>
              <AddPropertyDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-properties"
          element={
            <ProtectedRoute>
              <MyProperties />
            </ProtectedRoute>
          }
        />

        <Route
          path="/wallet"
          element={
            <ProtectedRoute roles={["agent", "individual_seller"]}>
              <Wallet />
            </ProtectedRoute>
          }
        />

        <Route
          path="/withdraw"
          element={
            <ProtectedRoute roles={["agent", "individual_seller"]}>
              <Withdraw />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute role="admin">
              <AdminAuditLogs />
            </ProtectedRoute>
          }
        />


        <Route
          path="/verify-bank"
          element={
            <ProtectedRoute roles={["agent", "individual_seller"]}>
              <VerifyBank />
            </ProtectedRoute>
          }
        />

        {/* ================= ADMIN ================= */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/revenue"
          element={
            <ProtectedRoute role="admin">
              <AdminRevenue />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute role="admin">
              <AdminOrders />
            </ProtectedRoute>
          }
        />


        <Route
          path="/admin/users"
          element={
            <ProtectedRoute role="admin">
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/seller-requests"
          element={
            <ProtectedRoute role="admin">
              <AdminSellerRequests />
            </ProtectedRoute>
          }
        />
        
  
        <Route
          path="/admin/listings"
          element={
            <ProtectedRoute role="admin">
              <AdminListings />
            </ProtectedRoute>
          }
        />


        <Route
          path="/admin/withdrawals"
          element={
            <ProtectedRoute role="admin">
              <AdminWithdrawals />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/services"
          element={<AdminServices />}
        />

        <Route
          path="/my-services"
          element={<ServiceDashboard />}
        />


      {/* ================= FALLBACK ================= */}
        <Route
          path="*"
          element={
            <div style={{ padding: 40 }}>
              <h2>404 – Page Not Found</h2>
            </div>
          }
        />
      </Routes>

      {/* ✅ GLOBAL FOOTER */}
      <Footer />
    </>
  );
}

export default App;
