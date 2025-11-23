import { AdminLayout } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  DollarSign,
  Download,
  Calendar,
} from "lucide-react";

export default function AdminAnalytics() {
  const metrics = [
    {
      label: "Monthly Revenue",
      value: "$12,450",
      change: "+8.5%",
      positive: true,
      icon: DollarSign,
    },
    {
      label: "Active Users",
      value: "2,543",
      change: "+125",
      positive: true,
      icon: Users,
    },
    {
      label: "Course Enrollments",
      value: "1,892",
      change: "+12%",
      positive: true,
      icon: BookOpen,
    },
    {
      label: "Conversion Rate",
      value: "3.2%",
      change: "-0.5%",
      positive: false,
      icon: TrendingUp,
    },
  ];

  const topCourses = [
    {
      rank: 1,
      title: "Conversational English",
      students: 421,
      revenue: "$4,210",
      rating: 4.8,
    },
    {
      rank: 2,
      title: "English A1 Beginner",
      students: 342,
      revenue: "$3,420",
      rating: 4.6,
    },
    {
      rank: 3,
      title: "Business English Pro",
      students: 289,
      revenue: "$5,802",
      rating: 4.9,
    },
    {
      rank: 4,
      title: "Listening Comprehension",
      students: 213,
      revenue: "$2,130",
      rating: 4.5,
    },
    {
      rank: 5,
      title: "IELTS Preparation",
      students: 156,
      revenue: "$3,120",
      rating: 4.7,
    },
  ];

  const userGrowth = [
    { month: "Jan", students: 450, teachers: 12, admins: 1 },
    { month: "Feb", students: 680, teachers: 18, admins: 2 },
    { month: "Mar", students: 950, teachers: 24, admins: 2 },
  ];

  const engagementMetrics = [
    {
      metric: "Avg Lesson Completion",
      value: "78%",
      trend: "+5%",
    },
    {
      metric: "Course Completion Rate",
      value: "62%",
      trend: "+8%",
    },
    {
      metric: "Daily Active Users",
      value: "342",
      trend: "+12%",
    },
    {
      metric: "User Retention (30 days)",
      value: "71%",
      trend: "+3%",
    },
  ];

  const revenueBySource = [
    { source: "Course Sales", amount: "$8,420", percentage: 68 },
    { source: "Subscriptions", amount: "$2,800", percentage: 22 },
    { source: "Premium Content", amount: "$1,230", percentage: 10 },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Analytics & Reports</h2>
            <p className="text-muted-foreground">
              Platform performance metrics and insights
            </p>
          </div>
          <Button className="gap-2">
            <Download size={18} />
            Export Report
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                className="p-6 rounded-xl border bg-background hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="text-primary" size={24} />
                  </div>
                  <span
                    className={`text-xs font-semibold flex items-center gap-1 ${
                      metric.positive
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {metric.positive ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                    {metric.change}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm mb-1">
                  {metric.label}
                </p>
                <p className="text-3xl font-bold">{metric.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Top Courses */}
          <div className="lg:col-span-2 p-6 rounded-xl border bg-background">
            <h3 className="text-xl font-bold mb-6">Top Performing Courses</h3>

            <div className="space-y-3">
              {topCourses.map((course) => (
                <div
                  key={course.rank}
                  className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm">
                    {course.rank}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{course.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {course.students} students enrolled
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{course.revenue}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      ⭐ {course.rating}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Growth Chart (Text-based) */}
          <div className="p-6 rounded-xl border bg-background">
            <h3 className="text-xl font-bold mb-6">User Growth</h3>

            <div className="space-y-4">
              {userGrowth.map((item) => (
                <div key={item.month}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{item.month}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.students + item.teachers} total
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Students</span>
                      <span className="font-semibold">{item.students}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Teachers</span>
                      <span className="font-semibold">{item.teachers}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Engagement Metrics */}
          <div className="p-6 rounded-xl border bg-background">
            <h3 className="text-xl font-bold mb-6">User Engagement</h3>

            <div className="space-y-4">
              {engagementMetrics.map((item, index) => (
                <div key={index} className="pb-4 border-b last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">
                      {item.metric}
                    </span>
                    <span className="text-xs text-green-600 font-semibold">
                      {item.trend}
                    </span>
                  </div>
                  <div className="flex items-end gap-4">
                    <p className="text-2xl font-bold">{item.value}</p>
                    <div className="flex-1 h-8 bg-muted rounded-sm relative overflow-hidden">
                      <div
                        className="h-full bg-primary/30 rounded-sm"
                        style={{
                          width: item.value.includes("%")
                            ? item.value
                            : "75%",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue by Source */}
          <div className="p-6 rounded-xl border bg-background">
            <h3 className="text-xl font-bold mb-6">Revenue Breakdown</h3>

            <div className="space-y-4">
              {revenueBySource.map((item, index) => (
                <div key={index} className="pb-4 border-b last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">
                      {item.source}
                    </span>
                    <span className="text-sm font-bold">{item.amount}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.percentage}% of total
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Date Range Filter & Export */}
        <div className="p-6 rounded-xl border bg-background">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Reporting Period:
              </span>
              <select className="px-4 py-2 border rounded-lg bg-background text-sm">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Last year</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download size={16} className="mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm">
                <Download size={16} className="mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
