import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Layers,
  DoorOpen,
  CalendarCheck,
  ClipboardList,
  FileText,
  ShieldCheck,
  History,
  Wallet,
  Trophy,
  UsersRound,
  Settings,
  FileBarChart,
} from "lucide-react";
import { RoleShell } from "./RoleShell";
import { RoleGuard } from "@/components/RoleGuard";

const groups = [
  {
    label: "Overview",
    items: [
      { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Academic",
    items: [
      { to: "/admin/students", label: "Students", icon: Users },
      { to: "/admin/teachers", label: "Teachers", icon: GraduationCap },
      { to: "/admin/classes", label: "Classes", icon: Layers },
      { to: "/admin/admissions", label: "Admissions", icon: DoorOpen },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/admin/attendance", label: "Attendance", icon: CalendarCheck },
      { to: "/admin/performance", label: "Performance", icon: ClipboardList },
      { to: "/admin/exams", label: "Exams", icon: FileText },
    ],
  },
  {
    label: "Governance",
    items: [
      { to: "/admin/verification", label: "Fee Approvals", icon: ShieldCheck },
      { to: "/admin/audit-trail", label: "Audit Trail", icon: History },
      { to: "/admin/ptm", label: "PTM & Reports", icon: FileBarChart },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/admin/fees", label: "Fee Management", icon: Wallet },
      { to: "/admin/activities", label: "Co-Curricular", icon: Trophy },
      { to: "/admin/users", label: "Users", icon: UsersRound },
      { to: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allow="admin">
      <RoleShell brand="Madrassah LMS" roleLabel="Admin / Management" groups={groups}>
        {children}
      </RoleShell>
    </RoleGuard>
  );
}
