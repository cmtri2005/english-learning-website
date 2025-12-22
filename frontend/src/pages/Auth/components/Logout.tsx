import { AppLayout } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
import { useLogoutHandler } from "../hooks/useLogoutHandler";

export default function Logout() {
  useLogoutHandler();

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <LogOut className="text-primary" size={24} />
          </div>
          <h1 className="text-2xl font-semibold">Signing you out...</h1>
          <p className="text-muted-foreground text-sm">
            Please wait a moment while we securely log you out.
          </p>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Logging out
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/login", { replace: true })}
          >
            Go to login
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}


