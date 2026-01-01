import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function EditProfile() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    location: ""
  });

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.get("/users/me").then(res => {
      setForm({
        first_name: res.data.first_name || "",
        last_name: res.data.last_name || "",
        phone_number: res.data.phone_number || "",
        location: res.data.location || ""
      });
      setLoading(false);
    });
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async e => {
    e.preventDefault();
    await api.patch("/users/me", form);
    setSuccess("Profile updated successfully");
  };

  if (loading) return <PageWrapper>Loading...</PageWrapper>;

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

      {success && (
        <p className="text-green-600 mb-4">{success}</p>
      )}

      <form onSubmit={submit} className="space-y-4 max-w-md">
        <input
          name="first_name"
          className="input"
          placeholder="First name"
          value={form.first_name}
          onChange={handleChange}
          required
        />

        <input
          name="last_name"
          className="input"
          placeholder="Last name"
          value={form.last_name}
          onChange={handleChange}
          required
        />

        <input
          name="phone_number"
          className="input"
          placeholder="Phone number"
          value={form.phone_number}
          onChange={handleChange}
          required
        />

        <input
          name="location"
          className="input"
          placeholder="Address"
          value={form.location}
          onChange={handleChange}
          required
        />

        <button className="btn-primary">
          Save Changes
        </button>
      </form>
    </PageWrapper>
  );
}

export default EditProfile;
