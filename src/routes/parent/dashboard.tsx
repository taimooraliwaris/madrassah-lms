import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarCheck,
  TrendingUp,
  Wallet,
  Bell,
  UserPlus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useSelectedChild } from "@/contexts/SelectedChildContext";
import {
  useChildAttendanceSummary,
  useChildLastExam,
  useChildFeePayments,
  useChildTodayPerformance,
  useSettings,
} from "@/hooks/queries";
import { Loader2 } from "lucide-react";
import { QuranicVerseCard } from "@/components/QuranicVerseCard";

export const Route = createFileRoute("/parent/dashboard")({
  component: ParentDashboard,
});

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function gradeFromScale(pct: number, scale: Array<{ grade: string; min: number }>) {
  if (!Array.isArray(scale)) return null;
  const sorted = [...scale].sort((a, b) => b.min - a.min);
  return sorted.find((r) => pct >= r.min)?.grade ?? null;
}

function ParentDashboard() {
  const { selectedChild, children, loading } = useSelectedChild();
  const { data: settings } = useSettings();

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <Card className="p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <UserPlus className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="mt-4 font-semibold">No students linked yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account isn't linked to any student records yet. Please contact
          the madrassah administrator to complete the link.
        </p>
      </Card>
    );
  }

  if (!selectedChild) return null;

  return (
    <div className="space-y-5">
      <QuranicVerseCard context="dashboard" variant="inline" />
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials(selectedChild.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-semibold truncate">
                {selectedChild.full_name}
              </div>
              <Badge className="bg-primary/15 text-primary hover:bg-primary/15 capitalize">
                {selectedChild.program}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {selectedChild.student_code}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Class · {selectedChild.class?.name ?? "Unassigned"}
              {selectedChild.teacher?.full_name
                ? ` · Teacher ${selectedChild.teacher.full_name}`
                : ""}
            </div>
          </div>
        </div>
      </Card>

      <TodayPerformanceCard
        studentId={selectedChild.id}
        todayLabel={today}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <AttendanceTile studentId={selectedChild.id} />
        <LastExamTile
          studentId={selectedChild.id}
          gradingScale={(settings?.grading_scale as any) ?? []}
        />
        <FeeStatusTile studentId={selectedChild.id} />
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Notifications</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          See the Notifications tab for the latest updates.
        </p>
      </Card>
    </div>
  );
}

function AttendanceTile({ studentId }: { studentId: string }) {
  const { data, isLoading } = useChildAttendanceSummary(studentId);
  return (
    <Card className="p-5">
      <CalendarCheck className="h-5 w-5 text-primary" />
      <div className="mt-3 text-2xl font-bold">
        {isLoading ? "…" : data?.rate != null ? `${data.rate}%` : "—"}
      </div>
      <div className="text-xs text-muted-foreground">
        Attendance ({data?.total ?? 0} recorded days)
      </div>
    </Card>
  );
}

function LastExamTile({
  studentId,
  gradingScale,
}: {
  studentId: string;
  gradingScale: Array<{ grade: string; min: number }>;
}) {
  const { data, isLoading } = useChildLastExam(studentId);
  let pct: number | null = null;
  let grade: string | null = null;
  let examName: string | null = null;
  if (data && !data.is_absent && data.exam_marks_entries?.total_marks) {
    pct = Math.round(
      (Number(data.marks_obtained ?? 0) /
        Number(data.exam_marks_entries.total_marks)) *
        100,
    );
    grade = gradeFromScale(pct, gradingScale);
    examName = data.exam_marks_entries.exam_name;
  }
  return (
    <Card className="p-5">
      <TrendingUp className="h-5 w-5 text-[var(--color-success)]" />
      <div className="mt-3 text-2xl font-bold">
        {isLoading ? "…" : grade ?? (pct != null ? `${pct}%` : "—")}
      </div>
      <div className="text-xs text-muted-foreground">
        {examName ? `${examName} · ${pct}%` : "Last exam grade"}
      </div>
    </Card>
  );
}

function FeeStatusTile({ studentId }: { studentId: string }) {
  const { data: payments, isLoading } = useChildFeePayments(studentId);
  const now = new Date();
  const monthKey = now.toISOString().slice(0, 7);
  const monthName = now.toLocaleDateString("en-US", { month: "long" }).toLowerCase();
  const latest = (payments ?? [])[0];
  const currentPaid = (payments ?? []).find((p) => {
    const m = (p.month ?? "").toLowerCase();
    if (m === monthKey) return true;
    if (m.includes(monthKey)) return true;
    if (m.includes(monthName) && m.includes(String(now.getFullYear()))) return true;
    if (m === monthName) {
      const y = new Date(p.paid_on).getFullYear();
      return y === now.getFullYear();
    }
    return false;
  });
  return (
    <Card className="p-5">
      <Wallet className="h-5 w-5 text-accent-foreground" />
      <div className="mt-3 text-2xl font-bold">
        {isLoading
          ? "…"
          : currentPaid
            ? "Paid"
            : latest
              ? "Pending"
              : "—"}
      </div>
      <div className="text-xs text-muted-foreground">
        {currentPaid
          ? `${currentPaid.month} · ₨${Number(currentPaid.amount).toLocaleString()}`
          : latest
            ? `Last paid ${latest.month}`
            : "Current fee status"}
      </div>
    </Card>
  );
}

function TodayPerformanceCard({
  studentId,
  todayLabel,
}: {
  studentId: string;
  todayLabel: string;
}) {
  const { data, isLoading } = useChildTodayPerformance(studentId);
  const today = new Date().toISOString().slice(0, 10);
  const isToday = data?.date === today;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          {todayLabel}
        </h2>
        {data && !isToday && (
          <span className="text-xs text-muted-foreground">
            Most recent: {new Date(data.date).toLocaleDateString()}
          </span>
        )}
      </div>
      {isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : !data ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Today's performance data will appear here once teachers begin daily
          entries.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-5 gap-2 text-center">
          {(["aala", "behter", "munasib", "kamzore", "naaga"] as const).map(
            (g) => (
              <div key={g} className="rounded-md border p-2">
                <div className="text-xl font-bold">{data.counts[g] ?? 0}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {g}
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </Card>
  );
}
