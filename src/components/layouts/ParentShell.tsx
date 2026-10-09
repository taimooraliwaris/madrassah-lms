import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Home,
  CalendarCheck,
  TrendingUp,
  FileText,
  Wallet,
  LogOut,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useBranding } from "@/contexts/BrandingContext";
import { useUnreadCount } from "@/hooks/queries";
import { RoleGuard } from "@/components/RoleGuard";
import { cn } from "@/lib/utils";
import { SelectedChildProvider } from "@/contexts/SelectedChildContext";
import { ChildSwitcher } from "@/components/parent/ChildSwitcher";

const tabs = [
  { to: "/parent/dashboard", label: "Home", icon: Home },
  { to: "/parent/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/parent/progress", label: "Progress", icon: TrendingUp },
  { to: "/parent/reports", label: "Reports", icon: FileText },
  { to: "/parent/fees", label: "Fees", icon: Wallet },
];


function ParentShellInner({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const branding = useBranding();
  const navigate = useNavigate();
  const location = useLocation();
  const initials = (user?.email ?? "U").slice(0, 2).toUpperCase();
  const { data: unread = 0 } = useUnreadCount();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="sticky top-0 z-20 border-b bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <Link to="/parent/dashboard" className="flex items-center gap-2">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.institutionName}
                className="h-9 w-9 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
                {branding.institutionName.charAt(0)}
              </div>
            )}
            <div className="font-semibold tracking-tight">
              {branding.institutionName}
            </div>
          </Link>
          <nav className="ml-6 hidden md:flex items-center gap-1">
            {tabs.map((t) => {
              const active = location.pathname.startsWith(t.to);
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors relative",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                  {t.to === "/parent/notifications" && unread > 0 && (
                    <Badge className="ml-1 bg-destructive text-destructive-foreground">
                      {unread}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="flex-1" />
          <ChildSwitcher />
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="scrollbar-custom mx-auto w-full max-w-5xl flex-1 overflow-y-auto p-4 pb-24 md:pb-6">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card md:hidden">
        <ul className="flex">
          {tabs.map((t) => {
            const active = location.pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <li key={t.to} className="flex-1">
                <Link
                  to={t.to}
                  className={cn(
                    "relative flex flex-col items-center justify-center py-2 text-[11px] font-medium",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="mb-0.5 h-5 w-5" />
                  {t.label}
                  {t.to === "/parent/notifications" && unread > 0 && (
                    <span className="absolute right-3 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function ParentShell({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allow="parent">
      <SelectedChildProvider>
        <ParentShellInner>{children}</ParentShellInner>
      </SelectedChildProvider>
    </RoleGuard>
  );
}
