import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, XCircle, Eye } from "lucide-react";
import { EntityHeader } from "@/components/EntityHeader";
import { DataTable } from "@/components/data/DataTable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/forms/Field";
import {
  useVerificationQueue,
  useDecideVerification,
  type VerificationItem,
} from "@/hooks/queries";
import { formatRelative } from "@/lib/format";

export const Route = createFileRoute("/admin/verification")({
  component: VerificationPage,
});

function VerificationPage() {
  const { data = [], isLoading } = useVerificationQueue();
  const [selected, setSelected] = useState<VerificationItem | null>(null);

  const summary = useMemo(() => ({ pending: data.length }), [data]);

  const columns: ColumnDef<VerificationItem>[] = [
    {
      accessorKey: "entity_type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {(row.original.entity_type ?? "").replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "label",
      header: "Details",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.label ?? "—"}</span>
      ),
    },
    {
      accessorKey: "submitted_by_name",
      header: "Operator",
      cell: ({ row }) => row.original.submitted_by_name ?? "—",
    },
    {
      accessorKey: "submitted_at",
      header: "Submitted",
      cell: ({ row }) => formatRelative(row.original.submitted_at),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            setSelected(row.original);
          }}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" /> Review
        </Button>
      ),
    },
  ];

  return (
    <div>
      <EntityHeader
        title="Verification Queue"
        subtitle="Approve or reject operator-submitted entries"
      />

      <Alert className="mb-4 border-warning/40 bg-warning/10">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          These entries were submitted by operators and are pending your
          approval. Management-submitted entries bypass this queue. Finalized
          entries cannot be reversed without an audit note.
        </AlertDescription>
      </Alert>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatTile label="Pending" value={summary.pending} tone="warning" />
        <StatTile label="Approved today" value={0} tone="success" />
        <StatTile label="Rejected today" value={0} tone="destructive" />
      </div>

      <DataTable
        data={data}
        columns={columns}
        loading={isLoading}
        selectable
        emptyTitle="Queue is clear"
        emptyDescription="No operator entries are waiting for review."
        onRowClick={(r) => setSelected(r)}
      />

      <ReviewDrawer
        item={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "warning" | "success" | "destructive";
}) {
  const cls =
    tone === "success"
      ? "text-[var(--color-success)]"
      : tone === "destructive"
        ? "text-destructive"
        : "text-warning-foreground";
  return (
    <Card className="p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold ${cls}`}>{value}</div>
    </Card>
  );
}

function ReviewDrawer({
  item,
  onClose,
}: {
  item: VerificationItem | null;
  onClose: () => void;
}) {
  const decide = useDecideVerification();
  const [note, setNote] = useState("");

  const submit = async (decision: "approved" | "rejected") => {
    if (!item?.entity_type || !item.entity_id) return;
    if (decision === "rejected" && !note.trim()) {
      toast.error("Please add a rejection reason");
      return;
    }
    try {
      await decide.mutateAsync({
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        decision,
        note: note.trim() || undefined,
      });
      toast.success(`Entry ${decision}`);
      setNote("");
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Review entry</SheetTitle>
        </SheetHeader>
        {item && (
          <div className="mt-6 space-y-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Type
              </div>
              <div className="text-sm capitalize">
                {(item.entity_type ?? "").replace(/_/g, " ")}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Submitted by
              </div>
              <div className="text-sm">{item.submitted_by_name ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Details
              </div>
              <div className="text-sm">{item.label ?? "—"}</div>
            </div>
            <Field label="Review note">
              <Textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional for approve, required for reject"
              />
            </Field>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => submit("rejected")}
                disabled={decide.isPending}
              >
                <XCircle className="mr-1.5 h-4 w-4" /> Reject
              </Button>
              <Button
                className="flex-1"
                onClick={() => submit("approved")}
                disabled={decide.isPending}
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
