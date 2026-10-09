import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, KeyRound, Search } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { EntityHeader } from "@/components/EntityHeader";
import { TabBar } from "@/components/TabBar";
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
import { UserFormDialog } from "@/components/forms/UserFormDialog";
import { useUsers, useSetUserRole, type UserRow } from "@/hooks/queries";
import { sendPasswordResetFn } from "@/lib/users.functions";
import { formatRelative } from "@/lib/format";

export const Route = createFileRoute("/admin/users/")({
  component: UsersPage,
});

type TabId = "all" | "admin" | "operator" | "parent";

function UsersPage() {
  const { data = [], isLoading } = useUsers();
  const setRole = useSetUserRole();
  const reset = useServerFn(sendPasswordResetFn);
  const [tab, setTab] = useState<TabId>("all");
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const counts = useMemo(() => {
    const c = { admin: 0, operator: 0, parent: 0 };
    data.forEach((u) => {
      if (u.role && u.role in c) (c as any)[u.role]++;
    });
    return c;
  }, [data]);

  const rows = useMemo(
    () =>
      data.filter((u) => {
        if (tab !== "all" && u.role !== tab) return false;
        if (q) {
          const n = q.toLowerCase();
          if (
            !(u.full_name ?? "").toLowerCase().includes(n) &&
            !(u.phone ?? "").toLowerCase().includes(n)
          )
            return false;
        }
        return true;
      }),
    [data, tab, q],
  );

  const columns: ColumnDef<UserRow>[] = [
    {
      accessorKey: "full_name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.full_name ?? "—"}</div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone ?? "—",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Select
          value={row.original.role ?? ""}
          onValueChange={(v) =>
            setRole.mutate(
              {
                user_id: row.original.id,
                role: v as "admin" | "operator" | "parent",
              },
              {
                onSuccess: () => toast.success("Role updated"),
                onError: (e: any) => toast.error(e?.message ?? "Failed"),
              },
            )
          }
        >
          <SelectTrigger className="h-8 w-[130px]" onClick={(e) => e.stopPropagation()}>
            <SelectValue placeholder="No role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="operator">Operator</SelectItem>
            <SelectItem value="parent">Parent</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Joined",
      cell: ({ row }) => formatRelative(row.original.created_at),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={async (e) => {
            e.stopPropagation();
            const email = window.prompt(
              "Enter the user's email to send a password reset link",
              "",
            );
            if (!email) return;
            try {
              await reset({ data: { email } });
              toast.success("Reset link sent");
            } catch (err: any) {
              toast.error(err?.message ?? "Failed to send reset");
            }
          }}
        >
          <KeyRound className="mr-1.5 h-3.5 w-3.5" /> Reset
        </Button>
      ),
    },
  ];

  return (
    <div>
      <EntityHeader
        title="User Management"
        subtitle="Admins, operators and parent accounts"
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <TabBar
          tabs={[
            { id: "all", label: "All", count: data.length },
            { id: "admin", label: "Admins", count: counts.admin },
            { id: "operator", label: "Operators", count: counts.operator },
            { id: "parent", label: "Parents", count: counts.parent },
          ]}
          value={tab}
          onChange={(v) => setTab(v as TabId)}
        />
        <div className="relative ml-auto w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        loading={isLoading}
        emptyTitle="No users found"
        emptyDescription="Add the first admin or operator to get started."
      />

      <UserFormDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
