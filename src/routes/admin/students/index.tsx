import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Plus, Search, Download } from "lucide-react";
import { toast } from "sonner";
import { EntityHeader } from "@/components/EntityHeader";
import { DataTable } from "@/components/data/DataTable";
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
import { useStudents, type StudentWithRefs } from "@/hooks/queries";
import { formatDate, programLabel } from "@/lib/format";

export const Route = createFileRoute("/admin/students/")({
  component: StudentsList,
});

function StudentsList() {
  const { data = [], isLoading } = useStudents();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [program, setProgram] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const rows = useMemo(
    () =>
      data.filter((s) => {
        if (program !== "all" && s.program !== program) return false;
        if (status !== "all" && s.status !== status) return false;
        if (q) {
          const needle = q.toLowerCase();
          if (
            !s.full_name.toLowerCase().includes(needle) &&
            !s.student_code.toLowerCase().includes(needle) &&
            !(s.class?.name ?? "").toLowerCase().includes(needle)
          )
            return false;
        }
        return true;
      }),
    [data, q, program, status],
  );

  const columns: ColumnDef<StudentWithRefs>[] = [
    {
      accessorKey: "student_code",
      header: "Student ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.student_code}</span>
      ),
    },
    {
      accessorKey: "full_name",
      header: "Full Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.full_name}</div>
          {row.original.father_name && (
            <div className="text-xs text-muted-foreground">
              s/o {row.original.father_name}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "program",
      header: "Program",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.program === "hifz"
              ? "border-primary/40 bg-primary/5 text-primary"
              : "border-accent/40 bg-accent/10 text-accent-foreground"
          }
        >
          {programLabel(row.original.program)}
        </Badge>
      ),
    },
    {
      header: "Class",
      cell: ({ row }) => row.original.class?.name ?? "—",
    },
    {
      header: "Assigned Teacher",
      cell: ({ row }) => row.original.teacher?.full_name ?? "—",
    },
    {
      accessorKey: "enrollment_date",
      header: "Enrolled",
      cell: ({ row }) => formatDate(row.original.enrollment_date),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        const cls =
          s === "active"
            ? "bg-success/15 text-[var(--color-success)]"
            : s === "pending"
              ? "bg-warning/15 text-warning-foreground"
              : "bg-muted text-muted-foreground";
        return (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <EntityHeader
        title="Students"
        subtitle="All enrolled students across programs"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => toast.info("CSV export arrives in Phase 3")}
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button asChild>
              <Link to="/admin/students/new">
                <Plus className="mr-2 h-4 w-4" /> Add New Student
              </Link>
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or class…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={program} onValueChange={setProgram}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Program" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            <SelectItem value="hifz">Hifz</SelectItem>
            <SelectItem value="nazra">Nazra</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        selectable
        loading={isLoading}
        emptyTitle="No students found"
        emptyDescription={
          data.length === 0
            ? "Add your first student to get started."
            : "Try adjusting your filters."
        }
        onRowClick={(s) =>
          navigate({
            to: "/admin/students/$studentId",
            params: { studentId: s.id },
          })
        }
        bulkBar={(_sel, clear) => (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toast.info("Bulk actions arrive in Phase 3")}
            >
              Export Selected
            </Button>
            <Button size="sm" variant="ghost" onClick={clear}>
              Clear
            </Button>
          </>
        )}
      />
    </div>
  );
}
