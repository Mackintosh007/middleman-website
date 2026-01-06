import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function Withdraw() {
  const navigate = useNavigate();

  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/wallet");

        // ✅ Check bank exists
        if (!res.data.bank_verified) {
          alert("Please add your bank details before withdrawing.");
          navigate("/verify-bank");
          return;
        }

        setWallet(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!amount || Number(amount) <= 0) {
      return setError("Enter a valid amount");
    }

    if (Number(amount) > Number(wallet.balance)) {
      return setError("Amount exceeds available balance");
    }

    setSubmitting(true);

    try {
      await api.post("/withdrawals/request", { amount });
      alert("Withdrawal request submitted");
      navigate("/wallet");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Withdrawal failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageWrapper>Loading...</PageWrapper>;
  }

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">
        Request Withdrawal
      </h1>

      <p className="mb-4 text-gray-600">
        Available Balance:{" "}
        <strong>
          ₦{Number(wallet.balance).toLocaleString()}
        </strong>
      </p>

      <form
        onSubmit={submit}
        className="max-w-sm space-y-4"
      >
        {error && (
          <p className="text-red-600">{error}</p>
        )}

        <div>
          <label className="block mb-1 font-medium">
            Amount (₦)
          </label>
          <input
            type="number"
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <button
          disabled={submitting}
          className="btn-primary"
        >
          {submitting ? "Submitting..." : "Withdraw"}
        </button>
      </form>
    </PageWrapper>
  );
}

export default Withdraw;
