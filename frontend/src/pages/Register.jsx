import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone_number: "",
    location: "",
    sex: "",
    dob: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/users/register", {
        ...form,
        role: "customer" // enforced
      });

      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.error || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create an Account</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={submit} className="space-y-4">

        {/* Names */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="first_name"
            placeholder="First name"
            className="input"
            onChange={handleChange}
            required
          />

          <input
            name="last_name"
            placeholder="Last name"
            className="input"
            onChange={handleChange}
            required
          />
        </div>

        {/* Email */}
        <input
          name="email"
          type="email"
          placeholder="Email address"
          className="input"
          onChange={handleChange}
          required
        />

        {/* Phone */}
        <input
          name="phone_number"
          placeholder="Phone number"
          className="input"
          onChange={handleChange}
          required
        />

        {/* Address */}
        <input
          name="location"
          placeholder="Residential address"
          className="input"
          onChange={handleChange}
          required
        />

        {/* Sex */}
        <select
          name="sex"
          className="input"
          onChange={handleChange}
          required
        >
          <option value="">Sex</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>

        {/* DOB */}
        <input
          name="dob"
          type="date"
          className="input"
          onChange={handleChange}
          required
        />

        {/* Password */}
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="input"
          onChange={handleChange}
          required
        />

        <button
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
    </div>
  );
}

export default Register;
