import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EntityHeader } from "@/components/EntityHeader";
import { EntryStatusBadge } from "@/components/StatusBadge";
import { DataTable } from "@/components/data/DataTable";
import { useMySubmissions, type OpSubmission } from "@/hooks/queries";
import { formatRelative } from "@/lib/format";
import type { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute("/operator/submissions/")({
  component: SubmissionsPage,
});

function SubmissionsPage() {
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const { data = [], isLoading } = useMySubmissions({ status, type });
  const [selected, setSelected] = useState<OpSubmission | null>(null);

  const summary = {
    total: data.length,
    approved: data.filter((d) => d.status === "approved").length,
    rejected: data.filter((d) => d.status === "rejected").length,
    pending: data.filter((d) => d.status === "pending").length,
  };

  const cols: ColumnDef<OpSubmission>[] = [
    { accessorKey: "entity_type", header: "Type", cell: ({ row }) => <span className="text-xs capitalize">{row.original.entity_type.replace(/_/g, " ")}</span> },
    { accessorKey: "label", header: "Details" },
    { accessorKey: "created_at", header: "Submitted", cell: ({ row }) => formatRelative(row.original.created_at) },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <EntryStatusBadge status={row.original.status} /> },
    {
      id: "actions", header: "", cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelected(row.original); }}>
          {row.original.status === "rejected" ? "View Reason" : "View"}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <EntityHeader title="My Submissions" subtitle="Track approval status of everything you've submitted." />

      <Card className="mb-4 flex flex-wrap items-center gap-3 p-3 text-sm">
        <span className="text-muted-foreground">This week:</span>
        <strong>{summary.total}</strong> submissions —{" "}
        <span className="text-[var(--color-success)]">{summary.approved} approved</span>,{" "}
        <span className="text-destructive">{summary.rejected} rejected</span>,{" "}
        <span className="text-warning-foreground">{summary.pending} pending</span>
      </Card>

      <Card className="mb-4 flex flex-wrap items-center gap-2 p-3">
        <FilterChip label="All types" v="all" cur={type} on={setType} />
        {(["attendance", "daily_marks", "exam_marks", "remark", "fee_payment"] as const).map((t) => (
          <FilterChip key={t} label={t.replace(/_/g, " ")} v={t} cur={type} on={setType} />
        ))}
        <span className="mx-2 h-4 w-px bg-border" />
        {(["all", "pending", "approved", "rejected"] as const).map((s) => (
          <FilterChip key={s} label={s} v={s} cur={status} on={setStatus} />
        ))}
      </Card>

      <DataTable
        data={data}
        columns={cols}
        loading={isLoading}
        emptyTitle="No submissions yet"
        emptyDescription="Your submitted entries will appear here."
      />

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Submission details</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-4 space-y-3 text-sm">
              <Row k="Type" v={selected.entity_type.replace(/_/g, " ")} />
              <Row k="Details" v={selected.label} />
              <Row k="Status" v={<EntryStatusBadge status={selected.status} />} />
              <Row k="Submitted" v={formatRelative(selected.created_at)} />
              {selected.reviewed_at && <Row k="Reviewed" v={formatRelative(selected.reviewed_at)} />}
              {selected.review_note && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <div className="text-xs font-semibold uppercase text-destructive">Admin note</div>
                  <p className="mt-1 text-sm">{selected.review_note}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FilterChip({ label, v, cur, on }: { label: string; v: string; cur: string; on: (v: string) => void }) {
  return (
    <button
      onClick={() => on(v)}
      className={`rounded-full border px-3 py-1 text-xs capitalize ${
        cur === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k}</div>
      <div className="mt-0.5">{v}</div>
    </div>
  );
}
