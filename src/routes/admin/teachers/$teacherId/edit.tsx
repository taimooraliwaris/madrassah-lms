import { createFileRoute } from "@tanstack/react-router";
import { EntityHeader } from "@/components/EntityHeader";
import { TeacherForm } from "@/components/forms/TeacherForm";
import { useTeacher } from "@/hooks/queries";

export const Route = createFileRoute("/admin/teachers/$teacherId/edit")({
  component: EditTeacher,
});

function EditTeacher() {
  const { teacherId } = Route.useParams();
  const { data, isLoading } = useTeacher(teacherId);
  return (
    <div>
      <EntityHeader
        title={data ? `Edit ${data.full_name}` : "Edit Teacher"}
        crumbs={[
          { label: "Teachers", to: "/admin/teachers" },
          { label: data?.full_name ?? "Teacher" },
          { label: "Edit" },
        ]}
      />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <TeacherForm initial={data ?? null} />
      )}
    </div>
  );
}
