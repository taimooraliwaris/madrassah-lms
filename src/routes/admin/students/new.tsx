import { createFileRoute } from "@tanstack/react-router";
import { EntityHeader } from "@/components/EntityHeader";
import { StudentForm } from "@/components/forms/StudentForm";

export const Route = createFileRoute("/admin/students/new")({
  component: () => (
    <div>
      <EntityHeader
        title="Add New Student"
        crumbs={[{ label: "Students", to: "/admin/students" }, { label: "Add" }]}
      />
      <StudentForm />
    </div>
  ),
});
