import { createFileRoute } from "@tanstack/react-router";
import { EntityHeader } from "@/components/EntityHeader";
import { StudentForm } from "@/components/forms/StudentForm";
import { useStudent } from "@/hooks/queries";

export const Route = createFileRoute("/admin/students/$studentId/edit")({
  component: EditStudent,
});

function EditStudent() {
  const { studentId } = Route.useParams();
  const { data, isLoading } = useStudent(studentId);
  return (
    <div>
      <EntityHeader
        title={data ? `Edit ${data.full_name}` : "Edit Student"}
        crumbs={[
          { label: "Students", to: "/admin/students" },
          { label: data?.full_name ?? "Student" },
          { label: "Edit" },
        ]}
      />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <StudentForm initial={data ?? null} />
      )}
    </div>
  );
}
