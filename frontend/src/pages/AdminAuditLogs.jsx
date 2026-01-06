import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/audit-logs")
      .then(res => setLogs(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">
        Admin Audit Logs
      </h1>

      {loading ? (
        <p>Loading logs...</p>
      ) : logs.length === 0 ? (
        <p>No audit records found.</p>
      ) : (
        <div className="overflow-x-auto bg-white border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Admin</th>
                <th className="p-2 border">Action</th>
                <th className="p-2 border">Entity</th>
                <th className="p-2 border">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td className="p-2 border">{l.admin_email}</td>
                  <td className="p-2 border">{l.action}</td>
                  <td className="p-2 border">
                    {l.entity_type} #{l.entity_id}
                  </td>
                  <td className="p-2 border">
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageWrapper>
  );
}

export default AdminAuditLogs;
