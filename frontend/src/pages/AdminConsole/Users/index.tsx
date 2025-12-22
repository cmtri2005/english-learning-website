import { AdminLayout } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui/button";
import { Search, Edit2, Trash2, Shield, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { toast } from "sonner";

interface User {
  user_id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | "admin" | "user">("All");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.adminRequest<{ users: User[] }>('/api/admin/users');
      if (res.success && res.data) {
        setUsers(res.data.users);
      }
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: number, newRole: string) => {
    try {
      const res = await api.adminRequest(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      if (res.success) {
        toast.success('User role updated');
        fetchUsers();
      } else {
        toast.error(res.message || 'Failed to update');
      }
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await api.adminRequest(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        toast.success('User deleted');
        fetchUsers();
      } else {
        toast.error(res.message || 'Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === "All" || user.role === roleFilter;
    return matchSearch && matchRole;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold">User Management</h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage users and assign roles
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white"
              />
            </div>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value="All">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Role</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Joined</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.user_id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                        {user.name?.charAt(0) || '?'}
                      </div>
                      <span className="font-medium">{user.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.role === 'admin'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                      }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateRole(user.user_id, user.role === 'admin' ? 'user' : 'admin')}
                        title={user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                      >
                        <Shield size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDelete(user.user_id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <p className="text-sm text-gray-500">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      </div>
    </AdminLayout>
  );
}

