import { AdminLayout } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui/button";
import {
  Users,
  BookOpen,
  TrendingUp,
  MessageSquare,
  DollarSign,
  Clock,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const stats = [
    {
      label: "Total Users",
      value: "2,543",
      icon: Users,
      change: "+125 this month",
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Active Courses",
      value: "48",
      icon: BookOpen,
      change: "+5 new courses",
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Revenue",
      value: "$45,231",
      icon: DollarSign,
      change: "+12% from last month",
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Pending Reviews",
      value: "23",
      icon: AlertCircle,
      change: "Content awaiting approval",
      color: "bg-orange-100 text-orange-600",
    },
  ];

  const recentUsers = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      role: "Student",
      joinDate: "2024-03-10",
      status: "Active",
    },
    {
      id: 2,
      name: "Michael Davis",
      email: "michael@example.com",
      role: "Teacher",
      joinDate: "2024-03-08",
      status: "Active",
    },
    {
      id: 3,
      name: "Emma Wilson",
      email: "emma@example.com",
      role: "Student",
      joinDate: "2024-03-05",
      status: "Inactive",
    },
    {
      id: 4,
      name: "Robert Brown",
      email: "robert@example.com",
      role: "Student",
      joinDate: "2024-03-01",
      status: "Active",
    },
    {
      id: 5,
      name: "Lisa Anderson",
      email: "lisa@example.com",
      role: "Teacher",
      joinDate: "2024-02-28",
      status: "Active",
    },
  ];

  const recentCourses = [
    {
      id: 1,
      title: "English A1 Beginner",
      instructor: "Sarah Johnson",
      students: 342,
      status: "Published",
    },
    {
      id: 2,
      title: "Business English Pro",
      instructor: "Michael Davis",
      students: 289,
      status: "Published",
    },
    {
      id: 3,
      title: "IELTS Preparation",
      instructor: "Emma Wilson",
      students: 156,
      status: "Draft",
    },
    {
      id: 4,
      title: "Conversational English",
      instructor: "Robert Brown",
      students: 421,
      status: "Published",
    },
  ];

  const pendingContent = [
    {
      id: 1,
      type: "Blog Post",
      title: "10 Tips for Learning English",
      author: "John Smith",
      submittedDate: "2024-03-10",
      status: "Pending Review",
    },
    {
      id: 2,
      type: "Forum Thread",
      title: "Questions about Grammar",
      author: "Jane Doe",
      submittedDate: "2024-03-09",
      status: "Flagged",
    },
    {
      id: 3,
      type: "Blog Post",
      title: "My Learning Journey",
      author: "Tom Wilson",
      submittedDate: "2024-03-08",
      status: "Pending Review",
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold mb-2">Welcome back, Admin</h2>
          <p className="text-muted-foreground">
            Here's what's happening with your platform today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="p-6 rounded-xl border bg-background hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <Icon size={24} />
                  </div>
                  <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                    <ArrowUpRight size={14} />
                    {stat.change.split(" ")[0]}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm mb-1">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold mb-2">{stat.value}</p>
                <p className="text-xs text-muted-foreground">
                  {stat.change}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Users */}
          <div className="lg:col-span-2 p-6 rounded-xl border bg-background">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Recent Users</h3>
              <Link to="/admin/users">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm px-2 py-1 bg-primary/10 text-primary rounded">
                      {user.role}
                    </span>
                    <span
                      className={`text-sm px-2 py-1 rounded ${
                        user.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-6 rounded-xl border bg-background">
            <h3 className="text-xl font-bold mb-6">Quick Actions</h3>

            <div className="space-y-3">
              <Link to="/admin/users">
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Users size={18} />
                  Add New User
                </Button>
              </Link>
              <Link to="/admin/courses">
                <Button className="w-full justify-start gap-2" variant="outline">
                  <BookOpen size={18} />
                  Create Course
                </Button>
              </Link>
              <Link to="/admin/moderation">
                <Button className="w-full justify-start gap-2" variant="outline">
                  <MessageSquare size={18} />
                  Review Content
                </Button>
              </Link>
              <Link to="/admin/analytics">
                <Button className="w-full justify-start gap-2" variant="outline">
                  <TrendingUp size={18} />
                  View Reports
                </Button>
              </Link>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                System Status
              </p>
              <p className="text-xs text-blue-700 mb-2">
                All systems operational
              </p>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1" />
                <span className="text-xs text-blue-700">Running smoothly</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Courses */}
          <div className="p-6 rounded-xl border bg-background">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Recent Courses</h3>
              <Link to="/admin/courses">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {recentCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold">{course.title}</p>
                    <p className="text-sm text-muted-foreground">
                      by {course.instructor}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {course.students} students
                    </span>
                    <span
                      className={`text-sm px-2 py-1 rounded ${
                        course.status === "Published"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {course.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Content */}
          <div className="p-6 rounded-xl border bg-background">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Pending Content Review</h3>
              <Link to="/admin/moderation">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {pendingContent.map((content) => (
                <div
                  key={content.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                        {content.type}
                      </span>
                      {content.status === "Flagged" && (
                        <AlertCircle size={14} className="text-orange-600" />
                      )}
                    </div>
                    <p className="font-semibold text-sm">{content.title}</p>
                    <p className="text-xs text-muted-foreground">
                      by {content.author}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      content.status === "Flagged"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {content.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
