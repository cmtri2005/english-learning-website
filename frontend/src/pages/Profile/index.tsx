import { Button } from "@/shared/components/ui/button";
import { AppLayout } from "@/shared/components/layout";
import { User, Mail, Phone, MapPin, Edit2 } from "lucide-react";

export default function Profile() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Profile</h1>
            <p className="text-lg text-muted-foreground">
              Manage your personal information and preferences
            </p>
          </div>

          {/* Profile Card */}
          <div className="p-8 rounded-xl border bg-background mb-8">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-4xl font-semibold">
                  J
                </div>
                <div>
                  <h2 className="text-2xl font-bold">John Doe</h2>
                  <p className="text-muted-foreground">john@example.com</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                      Premium Member
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                      Verified
                    </span>
                  </div>
                </div>
              </div>
              <Button size="sm" className="gap-2">
                <Edit2 size={16} />
                Edit Profile
              </Button>
            </div>

            {/* Profile Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Mail className="text-muted-foreground" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">john@example.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="text-muted-foreground" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-semibold">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <MapPin className="text-muted-foreground" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-semibold">New York, USA</p>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Statistics */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border bg-background text-center">
              <p className="text-sm text-muted-foreground mb-2">Total Hours</p>
              <p className="text-3xl font-bold">24.5 hrs</p>
            </div>
            <div className="p-6 rounded-xl border bg-background text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Courses Enrolled
              </p>
              <p className="text-3xl font-bold">5</p>
            </div>
            <div className="p-6 rounded-xl border bg-background text-center">
              <p className="text-sm text-muted-foreground mb-2">Current Streak</p>
              <p className="text-3xl font-bold">12 days</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
