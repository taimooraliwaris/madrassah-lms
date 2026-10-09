import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CalendarCheck,
  Check,
  ClipboardList,
  Receipt,
  PencilRuler,
  MessageSquare,
  UploadCloud,
  CheckCircle2,
} from "lucide-react";
import { EntryStatusBadge } from "@/components/StatusBadge";
import { useOperatorToday, useMySubmissions } from "@/hooks/queries";
import { formatRelative } from "@/lib/format";

export const Route = createFileRoute("/operator/dashboard")({
  component: OperatorDashboard,
});

function OperatorDashboard() {
  const { data: today } = useOperatorToday();
  const { data: subs = [] } = useMySubmissions();

  const tasks = useMemo(() => {
    if (!today) return [];
    const list: { id: string; title: string; done: boolean; to?: string }[] = [];
    for (const c of today.classes) {
      list.push({
        id: `att:${c.id}`,
        title: `Attendance — ${c.name}`,
        done: today.attendanceDone.has(c.id),
        to: "/operator/attendance",
      });
    }
    return list;
  }, [today]);

  const completed = tasks.filter((t) => t.done).length;
  const recent = subs.slice(0, 5);
  const rejected = subs.filter((s) => s.status === "rejected").slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Good morning</h1>
        <p className="text-sm text-muted-foreground">
          Here's today's data entry ·{" "}
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Today's Tasks</h2>
          <span className="text-xs text-muted-foreground">
            {completed} of {tasks.length} completed
          </span>
        </div>
        <Progress
          value={tasks.length ? (completed / tasks.length) * 100 : 0}
          className="mt-3 h-2"
        />
        {tasks.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No active classes yet. Once classes are created, your daily tasks
            will appear here.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-md border bg-card p-3"
              >
                <div
                  className={
                    t.done
                      ? "flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-[var(--color-success)]"
                      : "flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-muted-foreground/50"
                  }
                >
                  {t.done && <Check className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 text-sm">
                  <span
                    className={
                      t.done ? "text-muted-foreground line-through" : "font-medium"
                    }
                  >
                    {t.title}
                  </span>
                </div>
                {!t.done && t.to && (
                  <Button asChild size="sm">
                    <Link to={t.to}>Enter now</Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">My Recent Submissions</h2>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No submissions yet today.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {recent.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{r.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelative(r.created_at)}
                    </div>
                  </div>
                  <EntryStatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          className={
            rejected.length
              ? "border-destructive/30 bg-destructive/5 p-5"
              : "border-success/30 bg-success/5 p-5"
          }
        >
          <h2 className="font-semibold">Rejected — Needs Correction</h2>
          {rejected.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15 text-[var(--color-success)]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-medium">All clear!</p>
              <p className="text-xs text-muted-foreground">
                No rejected entries — keep it up.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {rejected.map((r) => (
                <li key={r.id} className="rounded-md border bg-card p-3">
                  <div className="text-sm font-medium">{r.label}</div>
                  {r.review_note && (
                    <div className="mt-1 text-xs text-destructive">
                      {r.review_note}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold">Quick entry</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(
            [
              { i: CalendarCheck, l: "Attendance", to: "/operator/attendance" },
              { i: PencilRuler, l: "Daily Marks", to: "/operator/marks" },
              { i: ClipboardList, l: "Exam Marks", to: "/operator/exams" },
              { i: MessageSquare, l: "Teacher Remarks", to: "/operator/feedback" },
              { i: Receipt, l: "Fee Payment", to: "/operator/fees" },
              { i: UploadCloud, l: "Bulk Upload", to: "/operator/bulk" },
            ] as const
          ).map(({ i: Icon, l, to }) => (
            <Link
              key={l}
              to={to}
              className="flex flex-col items-center justify-center gap-2 rounded-md border bg-card p-5 text-sm font-medium transition-colors hover:bg-primary/5 hover:border-primary/30"
            >
              <Icon className="h-6 w-6 text-primary" />
              {l}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
