import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSelectedChild } from "@/contexts/SelectedChildContext";
import { useChildAttendanceMonth } from "@/hooks/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/parent/attendance")({
  component: ParentAttendance,
});

const STATUS_COLORS: Record<string, string> = {
  present: "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]",
  absent: "bg-destructive/15 text-destructive",
  late: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  excused: "bg-primary/15 text-primary",
};

function ParentAttendance() {
  const { selectedChild } = useSelectedChild();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() + 1 };
  });
  const { data, isLoading } = useChildAttendanceMonth(
    selectedChild?.id ?? null,
    cursor.y,
    cursor.m,
  );

  const byDate = useMemo(() => {
    const map = new Map<string, { status: string; remark: string | null }>();
    (data ?? []).forEach((r) => {
      // de-dupe: keep first row per date
      if (!map.has(r.attendance_entries.date)) {
        map.set(r.attendance_entries.date, {
          status: r.status,
          remark: r.remark,
        });
      }
    });
    return map;
  }, [data]);

  const monthLabel = new Date(cursor.y, cursor.m - 1, 1).toLocaleDateString(
    undefined,
    { month: "long", year: "numeric" },
  );

  const firstDow = new Date(cursor.y, cursor.m - 1, 1).getDay();
  const daysInMonth = new Date(cursor.y, cursor.m, 0).getDate();
  const cells: Array<{ day: number | null }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });

  const stats = useMemo(() => {
    // count from de-duped map, not raw rows
    const arr = Array.from(byDate.values());
    const present = arr.filter((r) => r.status === "present").length;
    const absent = arr.filter((r) => r.status === "absent").length;
    const late = arr.filter((r) => r.status === "late").length;
    const total = arr.length;
    // Late counts toward attendance (not absent)
    const rate = total ? Math.round(((present + late) / total) * 100) : null;
    return { present, absent, late, total, rate };
  }, [byDate]);

  const absentList = (data ?? [])
    .filter((r) => r.status === "absent")
    .sort((a, b) =>
      a.attendance_entries.date < b.attendance_entries.date ? 1 : -1,
    );

  if (!selectedChild) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Select a child to view attendance.
      </Card>
    );
  }

  const go = (delta: number) => {
    setCursor((c) => {
      let m = c.m + delta;
      let y = c.y;
      if (m < 1) {
        m = 12;
        y--;
      } else if (m > 12) {
        m = 1;
        y++;
      }
      return { y, m };
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          {selectedChild.full_name}'s Attendance
        </h1>
        <p className="text-sm text-muted-foreground">
          Daily attendance, marked by the madrassah.
        </p>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => go(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-semibold">{monthLabel}</div>
          <Button variant="ghost" size="icon" onClick={() => go(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="py-1 font-medium">
              {d}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((c, i) => {
              if (c.day == null) return <div key={i} className="h-12" />;
              const date = `${cursor.y}-${String(cursor.m).padStart(2, "0")}-${String(
                c.day,
              ).padStart(2, "0")}`;
              const rec = byDate.get(date);
              const color = rec
                ? STATUS_COLORS[rec.status] ?? "bg-muted"
                : "bg-muted/30 text-muted-foreground";
              return (
                <div
                  key={i}
                  title={rec?.remark ?? rec?.status ?? ""}
                  className={cn(
                    "flex h-12 flex-col items-center justify-center rounded-md text-xs font-medium",
                    color,
                  )}
                >
                  {c.day}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatBox label="Present" value={stats.present} />
        <StatBox label="Absent" value={stats.absent} />
        <StatBox label="Late" value={stats.late} />
        <StatBox
          label="Rate"
          value={stats.rate == null ? "—" : `${stats.rate}%`}
          tone={
            stats.rate == null
              ? "default"
              : stats.rate >= 85
                ? "good"
                : stats.rate >= 70
                  ? "warn"
                  : "bad"
          }
        />
      </div>

      <Card className="p-5">
        <h2 className="font-semibold">Absences</h2>
        {absentList.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No absences recorded this month.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {absentList.map((r, i) => (
              <li key={i} className="flex justify-between border-b pb-2">
                <span>{r.attendance_entries.date}</span>
                <span className="text-muted-foreground">
                  {r.remark ?? "Absent"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Attendance is marked by the madrassah administration and updated daily.
      </p>
    </div>
  );
}

function StatBox({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneColor =
    tone === "good"
      ? "text-[color:var(--color-success)]"
      : tone === "warn"
        ? "text-amber-600"
        : tone === "bad"
          ? "text-destructive"
          : "text-foreground";
  return (
    <Card className="p-4">
      <div className={cn("text-2xl font-bold", toneColor)}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}
