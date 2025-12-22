import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import {
  BarChart3,
  Users,
  BookOpen,
  MessageSquare,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  Home,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    {
      label: "Admin Dashboard",
      href: "/admin",
      icon: BarChart3,
    },
    {
      label: "User Management",
      href: "/admin/users",
      icon: Users,
    },
    {
      label: "Course Management",
      href: "/admin/courses",
      icon: BookOpen,
    },
    {
      label: "Exam Management",
      href: "/admin/exams/import",
      icon: BookOpen, // Or another icon like FileText
    },
    {
      label: "Content Moderation",
      href: "/admin/moderation",
      icon: MessageSquare,
    },
    {
      label: "Analytics & Reports",
      href: "/admin/analytics",
      icon: BarChart2,
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"
          } border-r bg-background transition-all duration-300 flex flex-col fixed h-screen left-0 top-0 z-40 md:static`}
      >
        {/* Logo Section */}
        <div className="p-4 border-b h-16 flex items-center justify-between">
          {sidebarOpen && (
            <Link to="/admin" className="flex items-center gap-2 font-bold">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white">
                A
              </div>
              <span className="text-sm font-semibold">LF Admin</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-2 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link key={item.href} to={item.href}>
                  <Button
                    variant={active ? "default" : "ghost"}
                    className={`w-full justify-start gap-3 ${!sidebarOpen && "px-2"
                      }`}
                    onClick={() => {
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout Section */}
        <div className="border-t p-4 space-y-2">
          <Link to="/">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
            >
              <Home size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>Back to Home</span>}
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col ${!sidebarOpen ? "md:ml-0" : "md:ml-0"
          } ml-20 md:ml-0`}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {location.pathname !== '/admin' && (
              <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                <ArrowLeft size={20} />
              </Button>
            )}
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold cursor-pointer">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
