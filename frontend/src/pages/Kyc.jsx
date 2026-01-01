import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function Kyc() {
  const [kyc, setKyc] = useState(null);
  const [form, setForm] = useState({
    id_type: "",
    id_document: "",
    bank_name: "",
    account_number: "",
    account_name: ""
  });

  useEffect(() => {
    api.get("/kyc/me").then(res => setKyc(res.data));
  }, []);

  const submit = async () => {
    await api.post("/kyc", form);
    alert("KYC submitted");
  };

  return (
    <PageWrapper>
      <h1 className="text-xl font-bold mb-4">Seller Verification</h1>

      {kyc?.status && (
        <p className="mb-4">
          Status: <strong>{kyc.status}</strong>
        </p>
      )}

      <input placeholder="ID Type" onChange={e => setForm({...form,id_type:e.target.value})} />
      <input placeholder="ID Document URL" onChange={e => setForm({...form,id_document:e.target.value})} />
      <input placeholder="Bank Name" onChange={e => setForm({...form,bank_name:e.target.value})} />
      <input placeholder="Account Number" onChange={e => setForm({...form,account_number:e.target.value})} />
      <input placeholder="Account Name" onChange={e => setForm({...form,account_name:e.target.value})} />

      <button onClick={submit} className="mt-4 bg-blue-600 text-white px-4 py-2">
        Submit KYC
      </button>
    </PageWrapper>
  );
}

export default Kyc;
