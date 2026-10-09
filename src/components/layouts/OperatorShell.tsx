import type { ReactNode } from "react";
import {
  Home,
  CalendarCheck,
  PencilRuler,
  UploadCloud,
  ClipboardList,
  MessageSquare,
  Receipt,
  ListChecks,
} from "lucide-react";
import { RoleShell } from "./RoleShell";
import { RoleGuard } from "@/components/RoleGuard";

const groups = [
  {
    label: "Overview",
    items: [
      { to: "/operator/dashboard", label: "My Dashboard", icon: Home },
    ],
  },
  {
    label: "Daily Entry",
    items: [
      {
        to: "/operator/attendance",
        label: "Attendance",
        icon: CalendarCheck,
      },
      { to: "/operator/marks", label: "Daily Marks", icon: PencilRuler },
      { to: "/operator/bulk", label: "Bulk Upload", icon: UploadCloud },
    ],
  },
  {
    label: "Other Entries",
    items: [
      { to: "/operator/exams", label: "Exam Marks", icon: ClipboardList },
      {
        to: "/operator/feedback",
        label: "Teacher Remarks",
        icon: MessageSquare,
      },
      { to: "/operator/fees", label: "Fee Payments", icon: Receipt },
    ],
  },
  {
    label: "Activity",
    items: [
      {
        to: "/operator/submissions",
        label: "My Submissions",
        icon: ListChecks,
      },
    ],
  },
];

export function OperatorShell({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allow="operator">
      <RoleShell
        brand="Madrassah LMS"
        roleLabel="Data Entry Executive"
        groups={groups}
        sidebarClass="bg-[oklch(0.22_0.03_220)] text-sidebar-foreground"
      >
        {children}
      </RoleShell>
    </RoleGuard>
  );
}
