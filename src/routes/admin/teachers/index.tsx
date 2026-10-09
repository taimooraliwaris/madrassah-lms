import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Search, LayoutGrid, List } from "lucide-react";
import { EntityHeader } from "@/components/EntityHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data/DataTable";
import { useTeachers, type Teacher } from "@/hooks/queries";
import { initials, formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/teachers/")({
  component: TeachersList,
});

function TeachersList() {
  const { data = [], isLoading } = useTeachers();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [view, setView] = useState<"grid" | "table">("grid");

  const rows = useMemo(
    () =>
      data.filter((t) => {
        if (status !== "all" && t.employment_status !== status) return false;
        if (q && !t.full_name.toLowerCase().includes(q.toLowerCase()))
          return false;
        return true;
      }),
    [data, q, status],
  );

  const columns: ColumnDef<Teacher>[] = [
    {
      accessorKey: "full_name",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.full_name}</div>
          {row.original.qualification && (
            <div className="text-xs text-muted-foreground">
              {row.original.qualification}
            </div>
          )}
        </div>
      ),
    },
    { accessorKey: "phone", header: "Phone", cell: ({ row }) => row.original.phone ?? "—" },
    {
      accessorKey: "experience_years",
      header: "Experience",
      cell: ({ row }) => `${row.original.experience_years ?? 0} yrs`,
    },
    {
      accessorKey: "joining_date",
      header: "Joined",
      cell: ({ row }) => formatDate(row.original.joining_date),
    },
    {
      accessorKey: "employment_status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.employment_status.replace("_", " ")}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <EntityHeader
        title="Teachers"
        subtitle="Faculty members and their assignments"
        actions={
          <Button asChild>
            <Link to="/admin/teachers/new">
              <Plus className="mr-2 h-4 w-4" /> Add Teacher
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search teachers…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="resigned">Resigned</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex rounded-md border bg-card">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("table")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer p-5 transition-all hover:shadow-md"
              onClick={() =>
                navigate({
                  to: "/admin/teachers/$teacherId/edit",
                  params: { teacherId: t.id },
                })
              }
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {initials(t.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{t.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.qualification ?? "—"}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(t.specializations ?? []).slice(0, 3).map((s) => (
                      <Badge key={s} variant="outline" className="text-[10px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                <span>{t.experience_years ?? 0} yrs experience</span>
                <Badge variant="outline" className="capitalize">
                  {t.employment_status.replace("_", " ")}
                </Badge>
              </div>
            </Card>
          ))}
          {rows.length === 0 && (
            <Card className="col-span-full p-10 text-center text-sm text-muted-foreground">
              No teachers match these filters.
            </Card>
          )}
        </div>
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          loading={isLoading}
          onRowClick={(t) =>
            navigate({
              to: "/admin/teachers/$teacherId/edit",
              params: { teacherId: t.id },
            })
          }
        />
      )}
    </div>
  );
}
