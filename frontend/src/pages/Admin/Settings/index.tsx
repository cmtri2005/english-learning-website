import { AdminLayout } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui/button";
import { Save, Shield, Bell, Mail, Lock, Globe } from "lucide-react";
import { useState } from "react";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: "Monolingo",
    siteDescription: "Master English with AI-Powered Learning",
    contactEmail: "admin@monolingo.com",
    maintenanceMode: false,
    emailNotifications: true,
    smsNotifications: false,
    twoFactorAuth: true,
    allowNewRegistrations: true,
    requireEmailVerification: true,
    maxUploadSize: "50",
    autoBackup: true,
  });

  const handleSave = () => {
    alert("Settings saved successfully!");
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold mb-2">Admin Settings</h2>
          <p className="text-muted-foreground">
            Configure platform settings and preferences
          </p>
        </div>

        {/* General Settings */}
        <div className="p-6 rounded-xl border bg-background space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b">
            <Globe className="text-primary" size={24} />
            <h3 className="text-xl font-bold">General Settings</h3>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Site Name
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) =>
                setSettings({ ...settings, siteName: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Site Description
            </label>
            <textarea
              value={settings.siteDescription}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  siteDescription: e.target.value,
                })
              }
              rows={3}
              className="w-full px-4 py-2 border rounded-lg bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) =>
                setSettings({ ...settings, contactEmail: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg bg-background"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-semibold">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">
                Temporarily disable the site for maintenance
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maintenanceMode: e.target.checked,
                })
              }
              className="w-5 h-5 cursor-pointer"
            />
          </div>
        </div>

        {/* Security Settings */}
        <div className="p-6 rounded-xl border bg-background space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b">
            <Shield className="text-primary" size={24} />
            <h3 className="text-xl font-bold">Security Settings</h3>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-semibold">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                Require 2FA for admin accounts
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.twoFactorAuth}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  twoFactorAuth: e.target.checked,
                })
              }
              className="w-5 h-5 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Max File Upload Size (MB)
            </label>
            <input
              type="number"
              value={settings.maxUploadSize}
              onChange={(e) =>
                setSettings({ ...settings, maxUploadSize: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg bg-background"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-semibold">Automatic Backups</p>
              <p className="text-sm text-muted-foreground">
                Enable daily automatic database backups
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoBackup}
              onChange={(e) =>
                setSettings({ ...settings, autoBackup: e.target.checked })
              }
              className="w-5 h-5 cursor-pointer"
            />
          </div>
        </div>

        {/* User Registration */}
        <div className="p-6 rounded-xl border bg-background space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b">
            <Lock className="text-primary" size={24} />
            <h3 className="text-xl font-bold">User Registration</h3>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-semibold">Allow New Registrations</p>
              <p className="text-sm text-muted-foreground">
                Allow users to sign up for new accounts
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.allowNewRegistrations}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  allowNewRegistrations: e.target.checked,
                })
              }
              className="w-5 h-5 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-semibold">Require Email Verification</p>
              <p className="text-sm text-muted-foreground">
                Users must verify email before accessing platform
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.requireEmailVerification}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  requireEmailVerification: e.target.checked,
                })
              }
              className="w-5 h-5 cursor-pointer"
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="p-6 rounded-xl border bg-background space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b">
            <Bell className="text-primary" size={24} />
            <h3 className="text-xl font-bold">Notifications</h3>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-semibold">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive email alerts for important events
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  emailNotifications: e.target.checked,
                })
              }
              className="w-5 h-5 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-semibold">SMS Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive SMS alerts for critical issues
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.smsNotifications}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  smsNotifications: e.target.checked,
                })
              }
              className="w-5 h-5 cursor-pointer"
            />
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 rounded-xl border border-red-200 bg-red-50 space-y-4">
          <h3 className="text-lg font-bold text-red-900">Danger Zone</h3>
          <p className="text-sm text-red-800">
            These actions are irreversible. Please proceed with caution.
          </p>

          <div className="space-y-3">
            <Button variant="outline" className="w-full text-red-600">
              Clear Cache
            </Button>
            <Button variant="outline" className="w-full text-red-600">
              Reset Database
            </Button>
            <Button variant="outline" className="w-full text-red-600">
              Delete All Logs
            </Button>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <Save size={18} />
          Save Settings
        </Button>
      </div>
    </AdminLayout>
  );
}
