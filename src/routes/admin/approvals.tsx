import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Eye, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { EntityHeader } from "@/components/EntityHeader";
import { DataTable } from "@/components/data/DataTable";
import { TabBar } from "@/components/TabBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/forms/Field";
import {
  useApprovalRequests,
  useDecideApproval,
  type ApprovalRequest,
} from "@/hooks/queries";
import { formatRelative } from "@/lib/format";

export const Route = createFileRoute("/admin/approvals")({
  component: ApprovalsPage,
});

type TabId = "pending" | "approved" | "rejected" | "all";

function ApprovalsPage() {
  const { data = [], isLoading } = useApprovalRequests();
  const [tab, setTab] = useState<TabId>("pending");
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0 };
    data.forEach((r) => {
      if (r.status === "pending") c.pending++;
      else if (r.status === "approved") c.approved++;
      else if (r.status === "rejected") c.rejected++;
    });
    return c;
  }, [data]);

  const rows = useMemo(
    () => (tab === "all" ? data : data.filter((r) => r.status === tab)),
    [data, tab],
  );

  const columns: ColumnDef<ApprovalRequest>[] = [
    {
      accessorKey: "entity_type",
      header: "Entity",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.entity_type}
        </Badge>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.action === "delete"
              ? "border-destructive/40 text-destructive"
              : "border-primary/40 text-primary"
          }
        >
          {row.original.action}
        </Badge>
      ),
    },
    {
      header: "Summary",
      cell: ({ row }) => (
        <span className="text-sm">
          {(row.original.payload as any)?.full_name ??
            (row.original.payload as any)?.email ??
            row.original.target_id?.slice(0, 8) ??
            "—"}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Requested",
      cell: ({ row }) => formatRelative(row.original.created_at),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
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
        title="Approvals"
        subtitle="Operator requests for creating or deleting students and users"
      />

      <Alert className="mb-4">
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription>
          Student and user creation/deletion always requires admin approval —
          even when other operator entries are auto-approved.
        </AlertDescription>
      </Alert>

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
        emptyTitle="No approval requests"
        emptyDescription="Operator-submitted create/delete requests will appear here."
        onRowClick={(r) => setSelected(r)}
      />

      <ReviewDrawer
        item={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function ReviewDrawer({
  item,
  onClose,
}: {
  item: ApprovalRequest | null;
  onClose: () => void;
}) {
  const decide = useDecideApproval();
  const [note, setNote] = useState("");

  const submit = async (decision: "approved" | "rejected") => {
    if (!item) return;
    if (decision === "rejected" && !note.trim()) {
      toast.error("Please add a reason");
      return;
    }
    try {
      await decide.mutateAsync({ id: item.id, decision, note: note.trim() || undefined });
      toast.success(`Request ${decision}`);
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
          <SheetTitle>Review request</SheetTitle>
        </SheetHeader>
        {item && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Entity" value={item.entity_type} />
              <Detail label="Action" value={item.action} />
              <Detail label="Status" value={item.status} />
              <Detail
                label="Requested"
                value={formatRelative(item.created_at)}
              />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                Payload
              </div>
              <pre className="overflow-x-auto rounded-md border bg-muted/30 p-2 text-[11px]">
                {JSON.stringify(item.payload, null, 2)}
              </pre>
            </div>
            <Field label="Decision note">
              <Textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Required when rejecting"
              />
            </Field>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => submit("rejected")}
                disabled={decide.isPending || item.status !== "pending"}
              >
                <XCircle className="mr-1.5 h-4 w-4" /> Reject
              </Button>
              <Button
                className="flex-1"
                onClick={() => submit("approved")}
                disabled={decide.isPending || item.status !== "pending"}
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve
              </Button>
            </div>
            {item.status !== "pending" && (
              <p className="text-xs text-muted-foreground">
                This request was already {item.status}.
              </p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm capitalize">{value}</div>
    </div>
  );
}
