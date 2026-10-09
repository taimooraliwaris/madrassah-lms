import { createFileRoute } from "@tanstack/react-router";
import { EntityHeader } from "@/components/EntityHeader";
import { TeacherForm } from "@/components/forms/TeacherForm";

export const Route = createFileRoute("/admin/teachers/new")({
  component: () => (
    <div>
      <EntityHeader
        title="Add Teacher"
        crumbs={[
          { label: "Teachers", to: "/admin/teachers" },
          { label: "Add" },
        ]}
      />
      <TeacherForm />
    </div>
  ),
});
