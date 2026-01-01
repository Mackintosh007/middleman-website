import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  // ⏳ Wait for auth to load
  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  // ❌ Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  /**
   * 🔐 ROLE CHECK
   * - Admin always allowed everywhere
   * - If roles are specified, user must match
   */
  if (
    roles &&
    user.role !== "admin" &&
    !roles.includes(user.role)
  ) {
    // ❗ DO NOT use replace here
    return <Navigate to="/dashboard" />;
  }

  return children;
}

export default ProtectedRoute;
