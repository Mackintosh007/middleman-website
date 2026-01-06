import { useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function VerifyBank() {
  const [form, setForm] = useState({
    bank_name: "",
    account_number: "",
  });

  const [verified, setVerified] = useState(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    try {
      setLoading(true);
      const res = await api.post("/bank/verify-bank", form);
      setVerified(res.data);
    } catch (err) {
      alert(err.response?.data?.error || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <h1 className="text-xl font-bold mb-4">
        Verify Bank Account
      </h1>

      <select
          className="border p-2 w-full mb-3"
          onChange={(e) =>
            setForm({ ...form, bank_name: e.target.value })
          }
        >
          <option value="">Select Bank</option>

          <option value="GTBank">GTBank</option>
          <option value="Access">Access Bank</option>
          <option value="Zenith">Zenith Bank</option>
          <option value="UBA">UBA</option>
          <option value="FirstBank">First Bank</option>

          <option value="Kuda">Kuda</option>
          <option value="Opay">Opay</option>
          <option value="Palmpay">Palmpay</option>
          <option value="Moniepoint">Moniepoint</option>
        </select>

      <input
        className="border p-2 w-full mb-3"
        placeholder="Account Number"
        value={form.account_number}
        onChange={(e) =>
          setForm({ ...form, account_number: e.target.value })
        }
      />

      <button
        onClick={verify}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2"
      >
        {loading ? "Verifying..." : "Verify Account"}
      </button>

      {verified && (
        <div className="mt-6 border p-4 rounded bg-green-50">
          <p>
            <strong>Account Name:</strong>{" "}
            {verified.account_name}
          </p>
          <p>
            <strong>Bank:</strong> {verified.bank_name}
          </p>
          <p>
            <strong>Account Number:</strong>{" "}
            {verified.account_number}
          </p>

          <p className="mt-2 text-green-700 font-semibold">
            Bank account verified & saved successfully
          </p>
        </div>
      )}
    </PageWrapper>
  );
}

export default VerifyBank;
