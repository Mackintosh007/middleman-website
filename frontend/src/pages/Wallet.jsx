import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";
import EmptyState from "../components/EmptyState";


function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/wallet");
        setWallet(res.data);
      } catch (err) {
        console.error("Failed to load wallet", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <PageWrapper>
        <p>Loading wallet...</p>
      </PageWrapper>
    );
  }

  if (!wallet) {
    return (
      <PageWrapper>
        <p className="text-red-600">
          Unable to load wallet.
        </p>
      </PageWrapper>
    );
  }

  // ✅ WITHDRAWAL RULE
  const canWithdraw = Number(wallet.balance) >= 100;

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">
        My Wallet
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Stat
          label="Available Balance"
          value={`₦${Number(wallet.balance).toLocaleString()}`}
        />

        <Stat
          label="Pending Balance"
          value={`₦${Number(wallet.pending).toLocaleString()}`}
        />
      </div>

      <p className="mt-6 text-sm text-gray-500">
        Funds become available after delivery is confirmed.
      </p>

      {/* ===============================
          WITHDRAW ACTION
      =============================== */}
      <div className="mt-8">
        <Link
          to={canWithdraw ? "/withdraw" : "#"}
          className={`inline-block px-6 py-3 rounded text-white text-sm font-medium ${
            canWithdraw
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          onClick={(e) => {
            if (!canWithdraw) e.preventDefault();
          }}
        >
          Request Withdrawal
        </Link>

        {!canWithdraw && (
          <p className="mt-2 text-sm text-red-500">
            Minimum withdrawal amount is ₦100.
          </p>
        )}
      </div>
    </PageWrapper>
  );
}
        <EmptyState
         title="No Funds Available"
         message="Your earnings will appear here after successful sales."
        />

function Stat({ label, value }) {
  return (
    <div className="border rounded p-6 bg-white">
      <p className="text-sm text-gray-500">
        {label}
      </p>
      <p className="text-2xl font-semibold">
        {value}
      </p>
    </div>
  );
}

export default Wallet;
