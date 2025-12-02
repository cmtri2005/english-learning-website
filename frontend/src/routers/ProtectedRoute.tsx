import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";
import { UserRole } from "@/services/api";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireRoles?: UserRole[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requireRoles,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if auth is required but user is not logged in
  if (requireAuth && !isLoggedIn) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requireRoles && user && !requireRoles.includes(user.role)) {
    return (
      <Navigate
        to="/unauthorized"
        state={{ from: location, requiredRoles: requireRoles }}
        replace
      />
    );
  }

  return <>{children}</>;
}
