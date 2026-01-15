import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ===============================
     LOAD USER FROM TOKEN
  =============================== */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await api.get("/auth/me");

        // ✅ ENSURE ROLE EXISTS
        setUser({
          id: res.data.id,
          email: res.data.email,
          role: res.data.role,
          verified: res.data.verified,
        });
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  /* ===============================
     LOGIN
  =============================== */
  const login = async (email, password) => {
  try {
    const res = await api.post("/auth/login", {
      email,
      password,
    });

    console.log("LOGIN RESPONSE:", res.data);

    localStorage.setItem("token", res.data.token);

    setUser({
      id: res.data.user.id,
      email: res.data.user.email,
      role: res.data.user.role,
      verified: res.data.user.email_verified,
    });

    return true;
  } catch (err) {
    console.error("LOGIN ERROR:", err.response?.data || err.message);
    throw err;
  }
};

  /* ===============================
     LOGOUT
  =============================== */
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
