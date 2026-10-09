import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ParentShell } from "@/components/layouts/ParentShell";

export const Route = createFileRoute("/parent")({
  component: () => (
    <ParentShell>
      <Outlet />
    </ParentShell>
  ),
});
