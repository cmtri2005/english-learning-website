import { AdminLayout } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui/button";
import {
  Users,
  FileText,
  BookOpen,
  Target,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { api } from "@/services/api";

interface DashboardStats {
  total_users: number;
  total_exams: number;
  total_blogs: number;
  total_attempts: number;
  new_users_week: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminRequest<{ stats: DashboardStats }>('/api/admin/stats')
      .then((res) => {
        if (res.success && res.data) {
          setStats(res.data.stats);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    {
      label: "Total Users",
      value: stats.total_users,
      icon: Users,
      sub: `+${stats.new_users_week} tuần này`,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Đề thi",
      value: stats.total_exams,
      icon: BookOpen,
      sub: "TOEIC Listening & Reading",
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Blog Posts",
      value: stats.total_blogs,
      icon: FileText,
      sub: "Bài viết từ cộng đồng",
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Exam Attempts",
      value: stats.total_attempts,
      icon: Target,
      sub: "Lượt làm bài",
      color: "bg-orange-100 text-orange-600",
    },
  ] : [];

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold mb-1">Admin Dashboard</h2>
          <p className="text-muted-foreground text-sm">
            Tổng quan về hệ thống
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="p-5 rounded-xl border bg-background"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <Icon size={20} />
                  </div>
                </div>
                <p className="text-2xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/admin/users" className="p-5 rounded-xl border bg-background hover:bg-muted/50 transition-colors">
            <Users className="h-6 w-6 mb-3 text-muted-foreground" />
            <h3 className="font-medium mb-1">Quản lý Users</h3>
            <p className="text-sm text-muted-foreground">Xem, sửa role, xóa users</p>
          </Link>

          <Link to="/admin/moderation" className="p-5 rounded-xl border bg-background hover:bg-muted/50 transition-colors">
            <FileText className="h-6 w-6 mb-3 text-muted-foreground" />
            <h3 className="font-medium mb-1">Blog Moderation</h3>
            <p className="text-sm text-muted-foreground">Duyệt, publish, archive blogs</p>
          </Link>

          <Link to="/admin/exams/import" className="p-5 rounded-xl border bg-background hover:bg-muted/50 transition-colors">
            <BookOpen className="h-6 w-6 mb-3 text-muted-foreground" />
            <h3 className="font-medium mb-1">Import Exams</h3>
            <p className="text-sm text-muted-foreground">Import đề thi TOEIC mới</p>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
