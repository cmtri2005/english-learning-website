import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { AppLayout } from "@/shared/components/layout";

export default function Unauthorized() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <ShieldAlert className="text-red-600" size={40} />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button variant="outline">Go Home</Button>
            </Link>
            <Link to="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
