import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Download,
  History,
  ChevronRight,
  Search,
  ShieldAlert,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { EntityHeader } from "@/components/EntityHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuditLog, type AuditFilters } from "@/hooks/queries";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/audit-trail")({
  component: AuditTrailPage,
});

const ENTITIES = [
  "students",
  "teachers",
  "classes",
  "admissions",
  "parents",
  "parent_links",
  "user_roles",
  "settings",
  "approval_requests",
];

function AuditTrailPage() {
  const [filters, setFilters] = useState<AuditFilters>({
    action: "all",
    entity_type: "all",
    page: 0,
    pageSize: 50,
  });
  const { data, isLoading } = useAuditLog(filters);
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  const grouped = useMemo(() => {
    const byDay = new Map<string, typeof rows>();
    rows.forEach((r) => {
      const d = new Date(r.at);
      const key = d.toDateString();
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(r);
    });
    return Array.from(byDay.entries());
  }, [rows]);

  const exportCsv = () => {
    const header = ["timestamp", "actor", "action", "entity_type", "entity_id"];
    const lines = [header.join(",")];
    rows.forEach((r) => {
      lines.push(
        [
          new Date(r.at).toISOString(),
          (r as any).actor_name ?? "",
          r.action,
          r.entity_type,
          r.entity_id ?? "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      );
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <EntityHeader
        title="Audit Trail"
        subtitle="Complete history of all system changes — read-only"
      />

      <Card className="mb-4 border-amber-200/40 bg-amber-50/40 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        <ShieldAlert className="mr-2 inline h-4 w-4" />
        Audit records are permanent and cannot be deleted or modified.
      </Card>

      <Card className="mb-4 p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search action or content…"
              value={filters.search ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value, page: 0 })
              }
            />
          </div>
          <Select
            value={filters.action ?? "all"}
            onValueChange={(v) =>
              setFilters({ ...filters, action: v as any, page: 0 })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="insert">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.entity_type ?? "all"}
            onValueChange={(v) =>
              setFilters({ ...filters, entity_type: v, page: 0 })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entities</SelectItem>
              {ENTITIES.map((e) => (
                <SelectItem key={e} value={e}>
                  {e.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-1.5 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Loading…
        </Card>
      ) : grouped.length === 0 ? (
        <Card className="p-10 text-center">
          <History className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No audit entries match these filters.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, items]) => (
            <div key={day}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {dayLabel(day)}
              </div>
              <Card className="divide-y">
                {items.map((r) => (
                  <AuditRow key={r.id} row={r} />
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}

      {total > (filters.pageSize ?? 50) && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            Page {(filters.page ?? 0) + 1} of{" "}
            {Math.ceil(total / (filters.pageSize ?? 50))}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={(filters.page ?? 0) === 0}
              onClick={() =>
                setFilters({ ...filters, page: (filters.page ?? 0) - 1 })
              }
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={
                ((filters.page ?? 0) + 1) * (filters.pageSize ?? 50) >= total
              }
              onClick={() =>
                setFilters({ ...filters, page: (filters.page ?? 0) + 1 })
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function dayLabel(day: string) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (day === today) return "Today";
  if (day === yesterday) return "Yesterday";
  return formatDate(new Date(day));
}

function AuditRow({ row }: { row: any }) {
  const [open, setOpen] = useState(false);
  const time = new Date(row.at).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const Icon =
    row.action === "insert" ? Plus : row.action === "delete" ? Trash2 : Pencil;
  const tone =
    row.action === "insert"
      ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
      : row.action === "delete"
        ? "bg-destructive/15 text-destructive"
        : "bg-primary/15 text-primary";

  const summary =
    (row.after?.full_name ||
      row.after?.applicant_name ||
      row.after?.name ||
      row.before?.full_name ||
      row.before?.applicant_name ||
      row.before?.name ||
      row.entity_id?.slice(0, 8)) ?? "record";

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-start gap-3 p-3">
        <div className={`mt-0.5 rounded-md p-1.5 ${tone}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2 text-sm">
            <span className="font-medium">{row.actor_name}</span>
            <Badge variant="outline" className="capitalize">
              {row.action}
            </Badge>
            <span className="text-muted-foreground">
              {row.entity_type.replace(/_/g, " ")}
            </span>
            <span className="truncate text-sm">{summary}</span>
          </div>
          <div className="text-xs text-muted-foreground">{time}</div>
          {row.action === "update" && (
            <CollapsibleTrigger asChild>
              <button className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <ChevronRight
                  className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`}
                />
                {open ? "Hide" : "Show"} diff
              </button>
            </CollapsibleTrigger>
          )}
        </div>
      </div>
      <CollapsibleContent>
        <div className="grid gap-2 border-t bg-muted/30 p-3 sm:grid-cols-2">
          <DiffPane label="Before" value={row.before} />
          <DiffPane label="After" value={row.after} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function DiffPane({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-md border bg-card p-2">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-all text-[11px]">
        {value ? JSON.stringify(value, null, 2) : "—"}
      </pre>
    </div>
  );
}
