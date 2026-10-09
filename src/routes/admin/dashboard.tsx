import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  GraduationCap,
  DoorOpen,
  Layers,
  ArrowRight,
  ShieldCheck,
  ClipboardCheck,
} from "lucide-react";

import { StatsCard } from "@/components/StatsCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useDashboardStats,
  useClasses,
} from "@/hooks/queries";
import { formatRelative } from "@/lib/format";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, isLoading } = useDashboardStats();
  const { data: classes = [] } = useClasses();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of madrassah operations
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          icon={Users}
          label="Active Students"
          value={isLoading ? "…" : data?.students ?? 0}
        />
        <StatsCard
          icon={GraduationCap}
          label="Active Teachers"
          value={isLoading ? "…" : data?.teachers ?? 0}
          iconBg="bg-accent/15 text-accent-foreground"
        />
        <StatsCard
          icon={Layers}
          label="Active Classes"
          value={classes.filter((c) => c.status === "active").length}
          iconBg="bg-[var(--color-success)]/15 text-[var(--color-success)]"
        />
        <Link to="/admin/admissions">
          <StatsCard
            icon={DoorOpen}
            label="Pending Admissions"
            value={isLoading ? "…" : data?.pendingAdmissions ?? 0}
            alert={(data?.pendingAdmissions ?? 0) > 0}
            iconBg="bg-warning/15 text-warning-foreground"
          />
        </Link>
        <Link to="/admin/verification">
          <StatsCard
            icon={ShieldCheck}
            label="Pending Verifications"
            value={isLoading ? "…" : data?.pendingVerifications ?? 0}
            alert={(data?.pendingVerifications ?? 0) > 0}
            iconBg="bg-primary/15 text-primary"
          />
        </Link>
        <Link to="/admin/approvals">
          <StatsCard
            icon={ClipboardCheck}
            label="Pending Approvals"
            value={isLoading ? "…" : data?.pendingApprovals ?? 0}
            alert={(data?.pendingApprovals ?? 0) > 0}
            iconBg="bg-accent/15 text-accent-foreground"
          />
        </Link>
      </div>


      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent Activity</h2>
            <Link
              to="/admin/audit-trail"
              className="text-xs text-primary hover:underline"
            >
              View audit trail →
            </Link>
          </div>
          {(data?.recentActivity ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No recent activity yet. Actions will appear here as admins and
              operators make changes.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data!.recentActivity.map((a: any) => (
                <li
                  key={a.id}
                  className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <div className="text-sm capitalize">
                      <span className="font-medium">{a.action}</span>{" "}
                      <span className="text-muted-foreground">
                        on {a.entity_type}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelative(a.at)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Quick Actions</h2>
          </div>
          <div className="mt-4 space-y-2">
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/admin/admissions">
                Review admissions <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/admin/students/new">
                Add new student <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/admin/teachers/new">
                Add new teacher <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/admin/classes">
                Manage classes <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
