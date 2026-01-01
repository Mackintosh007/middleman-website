import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function AdminRevenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/admin/revenue");
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <PageWrapper>Loading revenue...</PageWrapper>;
  }

  if (!data) {
    return <PageWrapper>Failed to load revenue.</PageWrapper>;
  }

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">Revenue Dashboard</h1>

      {/* ESCROW */}
      <div className="bg-white border rounded p-6 mb-8">
        <h2 className="font-semibold text-lg mb-4">
          Escrow Revenue
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Stat
            label="Total Orders"
            value={data.escrow.total_orders}
          />
          <Stat
            label="Total Volume"
            value={`₦${Number(
              data.escrow.total_volume
            ).toLocaleString()}`}
          />
          <Stat
            label="Platform Fees (6.5%)"
            value={`₦${Number(
              data.escrow.total_fees
            ).toLocaleString()}`}
          />
        </div>
      </div>

      {/* COMMISSION */}
      <div className="bg-white border rounded p-6">
        <h2 className="font-semibold text-lg mb-4">
          Commission Revenue
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Stat
            label="Deals"
            value={data.commission.total_deals}
          />
          <Stat
            label="Deal Volume"
            value={`₦${Number(
              data.commission.total_volume
            ).toLocaleString()}`}
          />
          <Stat
            label="Expected Commission (10%)"
            value={`₦${Number(
              data.commission.total_commission
            ).toLocaleString()}`}
          />
          <Stat
            label="Paid Commission"
            value={`₦${Number(
              data.commission.paid_commission
            ).toLocaleString()}`}
          />
        </div>
      </div>
    </PageWrapper>
  );
}

function Stat({ label, value }) {
  return (
    <div className="border rounded p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

export default AdminRevenue;
