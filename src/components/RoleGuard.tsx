import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth, roleHome, type AppRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function RoleGuard({
  allow,
  children,
}: {
  allow: AppRole;
  children: ReactNode;
}) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  if (role && role !== allow) {
    return <Navigate to={roleHome(role)} />;
  }
  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-lg border bg-card p-6 text-center">
          <h2 className="text-lg font-semibold">No role assigned</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account doesn't have a role yet. Please contact the
            administrator to grant you access.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
