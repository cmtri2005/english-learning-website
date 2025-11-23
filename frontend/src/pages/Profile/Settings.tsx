import { Button } from "@/shared/components/ui/button";
import { AppLayout } from "@/shared/components/layout";
import { Bell, Shield, Globe, LogOut } from "lucide-react";
import { useState } from "react";

export default function Settings() {
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    courseReminders: true,
    newCourses: false,
    eventInvitations: true,
  });

  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("en");

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Settings</h1>
            <p className="text-lg text-muted-foreground">
              Customize your preferences and manage your account
            </p>
          </div>

          {/* Notification Settings */}
          <div className="mb-8 p-6 rounded-xl border bg-background">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="text-primary" size={24} />
              <h2 className="text-xl font-bold">Notifications</h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  key: "emailUpdates",
                  label: "Email Updates",
                  description: "Get updates about your learning progress",
                },
                {
                  key: "courseReminders",
                  label: "Course Reminders",
                  description: "Receive reminders for upcoming lessons",
                },
                {
                  key: "newCourses",
                  label: "New Courses",
                  description: "Be notified about new courses and content",
                },
                {
                  key: "eventInvitations",
                  label: "Event Invitations",
                  description: "Get invited to live events and workshops",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={
                      notifications[
                        item.key as keyof typeof notifications
                      ]
                    }
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        [item.key]: e.target.checked,
                      })
                    }
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div className="mb-8 p-6 rounded-xl border bg-background">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="text-primary" size={24} />
              <h2 className="text-xl font-bold">Preferences</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Theme
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-background"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-background"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="zh">中文</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="mb-8 p-6 rounded-xl border bg-background">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-primary" size={24} />
              <h2 className="text-xl font-bold">Privacy & Security</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-semibold">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Enable
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-semibold">Change Password</p>
                  <p className="text-sm text-muted-foreground">
                    Update your account password
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-semibold">Connected Devices</p>
                  <p className="text-sm text-muted-foreground">
                    Manage devices with access to your account
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="p-6 rounded-xl border border-red-200 bg-red-50">
            <h2 className="text-xl font-bold text-red-900 mb-4">Danger Zone</h2>

            <div className="space-y-3">
              <Button variant="outline" className="w-full text-red-600">
                <LogOut className="mr-2" size={16} />
                Log Out All Devices
              </Button>
              <Button variant="outline" className="w-full text-red-600">
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
