import { createFileRoute, Outlet } from "@tanstack/react-router";
import { OperatorShell } from "@/components/layouts/OperatorShell";

export const Route = createFileRoute("/operator")({
  component: () => (
    <OperatorShell>
      <Outlet />
    </OperatorShell>
  ),
});
