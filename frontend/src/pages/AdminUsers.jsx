import { useEffect, useState } from "react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 20;

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line
  }, [page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/admin/users?verified=false&page=${page}&limit=${limit}`
      );

      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleVerification = async (id, verified) => {
    const res = await api.patch(`/users/${id}/verify`, {
      verified: !verified
    });

    // remove user from list once verified
    setUsers(u => u.filter(x => x.id !== id));
    setTotal(t => t - 1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">
        Unverified Users
      </h1>

      {loading ? (
        <p>Loading users...</p>
      ) : users.length === 0 ? (
        <p className="text-gray-500">
          No unverified users.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto bg-white border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 border">Name</th>
                  <th className="p-3 border">Email</th>
                  <th className="p-3 border">Role</th>
                  <th className="p-3 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="text-center">
                    <td className="p-3 border">
                      {u.first_name} {u.last_name}
                    </td>
                    <td className="p-3 border">{u.email}</td>
                    <td className="p-3 border capitalize">
                      {u.role.replace("_", " ")}
                    </td>
                    <td className="p-3 border">
                      <button
                        onClick={() =>
                          toggleVerification(u.id, u.verified)
                        }
                        className="px-3 py-1 bg-green-600 text-white rounded"
                      >
                        Verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex gap-3 mt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>

              <span className="px-2 py-1">
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </PageWrapper>
  );
}

export default AdminUsers;
