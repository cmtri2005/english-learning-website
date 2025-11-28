import { AdminLayout } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui/button";
import { Search, Plus, Edit2, Trash2, Shield } from "lucide-react";
import { useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: "Student" | "Teacher" | "Admin";
  status: "Active" | "Inactive";
  joinDate: string;
  coursesEnrolled: number;
}

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | "Student" | "Teacher" | "Admin">("All");
  const [showAddForm, setShowAddForm] = useState(false);

  const users: User[] = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      role: "Student",
      status: "Active",
      joinDate: "2024-03-10",
      coursesEnrolled: 3,
    },
    {
      id: 2,
      name: "Michael Davis",
      email: "michael@example.com",
      role: "Teacher",
      status: "Active",
      joinDate: "2024-03-08",
      coursesEnrolled: 0,
    },
    {
      id: 3,
      name: "Emma Wilson",
      email: "emma@example.com",
      role: "Teacher",
      status: "Active",
      joinDate: "2024-03-05",
      coursesEnrolled: 0,
    },
    {
      id: 4,
      name: "Robert Brown",
      email: "robert@example.com",
      role: "Student",
      status: "Active",
      joinDate: "2024-03-01",
      coursesEnrolled: 2,
    },
    {
      id: 5,
      name: "Lisa Anderson",
      email: "lisa@example.com",
      role: "Admin",
      status: "Active",
      joinDate: "2024-02-28",
      coursesEnrolled: 0,
    },
    {
      id: 6,
      name: "John Smith",
      email: "john@example.com",
      role: "Student",
      status: "Inactive",
      joinDate: "2024-02-20",
      coursesEnrolled: 1,
    },
  ];

  const filteredUsers = users.filter((user) => {
    const matchSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole =
      roleFilter === "All" || user.role === roleFilter;
    return matchSearch && matchRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-700";
      case "Teacher":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-green-100 text-green-700";
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">User Management</h2>
            <p className="text-muted-foreground">
              Manage users, assign roles, and monitor activity
            </p>
          </div>
          <Button className="gap-2" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={18} />
            Add User
          </Button>
        </div>

        {/* Add User Form */}
        {showAddForm && (
          <div className="p-6 rounded-xl border bg-background space-y-4">
            <h3 className="text-lg font-bold">Add New User</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                className="px-4 py-2 border rounded-lg bg-background"
              />
              <input
                type="email"
                placeholder="Email Address"
                className="px-4 py-2 border rounded-lg bg-background"
              />
              <select className="px-4 py-2 border rounded-lg bg-background">
                <option>Select Role</option>
                <option>Student</option>
                <option>Teacher</option>
                <option>Admin</option>
              </select>
              <input
                type="password"
                placeholder="Password"
                className="px-4 py-2 border rounded-lg bg-background"
              />
            </div>
            <div className="flex gap-3">
              <Button className="bg-primary">Create User</Button>
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
              />
            </div>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-4 py-2 border rounded-lg bg-background"
          >
            <option>All Roles</option>
            <option>Student</option>
            <option>Teacher</option>
            <option>Admin</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="rounded-xl border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left font-semibold text-sm">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-sm">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-sm">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-sm">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-sm">
                    Join Date
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-sm">
                    Courses
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold">
                          {user.name.charAt(0)}
                        </div>
                        <span className="font-semibold">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          user.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {user.joinDate}
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold">
                      {user.coursesEnrolled}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Shield size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Previous
            </Button>
            <Button variant="outline" size="sm">
              1
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
