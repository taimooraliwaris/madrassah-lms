import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarClock, CheckCircle2, XCircle, Clock } from "lucide-react";
import { EntityHeader } from "@/components/EntityHeader";
import { TabBar } from "@/components/TabBar";
import { DataTable } from "@/components/data/DataTable";
import { StatsCard } from "@/components/StatsCard";
import { Badge } from "@/components/ui/badge";
import { AdmissionReviewDrawer } from "@/components/forms/AdmissionReviewDrawer";
import { useAdmissions, type Admission } from "@/hooks/queries";
import { formatDate, programLabel } from "@/lib/format";

export const Route = createFileRoute("/admin/admissions/")({
  component: AdmissionsPage,
});

type TabId = "pending" | "approved" | "rejected" | "all";

function AdmissionsPage() {
  const { data = [], isLoading } = useAdmissions();
  const [tab, setTab] = useState<TabId>("pending");
  const [selected, setSelected] = useState<Admission | null>(null);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, thisMonth: 0 };
    const now = new Date();
    data.forEach((a) => {
      if (a.status === "pending") c.pending++;
      if (a.status === "approved") c.approved++;
      if (a.status === "rejected") c.rejected++;
      const d = new Date(a.created_at);
      if (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      )
        c.thisMonth++;
    });
    return c;
  }, [data]);

  const rows = useMemo(() => {
    if (tab === "all") return data;
    return data.filter((a) => a.status === tab);
  }, [data, tab]);

  const columns: ColumnDef<Admission>[] = [
    {
      accessorKey: "applicant_name",
      header: "Applicant",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.applicant_name}</div>
      ),
    },
    {
      accessorKey: "program",
      header: "Program",
      cell: ({ row }) => (
        <Badge variant="outline">{programLabel(row.original.program)}</Badge>
      ),
    },
    {
      header: "Parent",
      cell: ({ row }) => (
        <div>
          <div className="text-sm">{row.original.parent_name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.parent_phone}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Applied",
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.status.replace("_", " ")}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <EntityHeader
        title="Admissions"
        subtitle="Review applications and enroll students"
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={Clock}
          label="Pending Review"
          value={counts.pending}
          iconBg="bg-warning/15 text-warning-foreground"
        />
        <StatsCard
          icon={CheckCircle2}
          label="Approved"
          value={counts.approved}
          iconBg="bg-[var(--color-success)]/15 text-[var(--color-success)]"
        />
        <StatsCard
          icon={XCircle}
          label="Rejected"
          value={counts.rejected}
          iconBg="bg-destructive/15 text-destructive"
        />
        <StatsCard
          icon={CalendarClock}
          label="This Month"
          value={counts.thisMonth}
        />
      </div>

      <div className="mb-4">
        <TabBar
          tabs={[
            { id: "pending", label: "Pending", count: counts.pending },
            { id: "approved", label: "Approved", count: counts.approved },
            { id: "rejected", label: "Rejected", count: counts.rejected },
            { id: "all", label: "All", count: data.length },
          ]}
          value={tab}
          onChange={(v) => setTab(v as TabId)}
        />
      </div>

      <DataTable
        data={rows}
        columns={columns}
        loading={isLoading}
        emptyTitle="No admissions"
        emptyDescription="Inquiries promoted to admissions will appear here."
        onRowClick={(a) => setSelected(a)}
      />

      <AdmissionReviewDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        admission={selected}
      />
    </div>
  );
}
