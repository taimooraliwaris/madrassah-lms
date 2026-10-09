// Shared student profile tabs reused by admin student profile and parent dashboard.
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  useChildAttendanceMonth,
  useChildDailyMarks,
  useChildExamResults,
  useChildFeePayments,
  useSubjects,
  useSubjectsByProgram,
} from "@/hooks/queries";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, string> = {
  present: "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]",
  absent: "bg-destructive/15 text-destructive",
  late: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  excused: "bg-primary/15 text-primary",
};

const GRADE_DOT: Record<string, string> = {
  aala: "bg-[color:var(--color-success)]",
  behter: "bg-primary",
  munasib: "bg-amber-500",
  kamzore: "bg-orange-500",
  naaga: "bg-destructive",
};

export function AttendanceTab({ studentId }: { studentId: string }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() + 1 };
  });
  const { data, isLoading } = useChildAttendanceMonth(studentId, cursor.y, cursor.m);
  const byDate = useMemo(() => {
    const map = new Map<string, { status: string; remark: string | null }>();
    (data ?? []).forEach((r) => {
      map.set(r.attendance_entries.date, { status: r.status, remark: r.remark });
    });
    return map;
  }, [data]);
  const monthLabel = new Date(cursor.y, cursor.m - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const firstDow = new Date(cursor.y, cursor.m - 1, 1).getDay();
  const daysInMonth = new Date(cursor.y, cursor.m, 0).getDate();
  const cells: Array<{ day: number | null }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  const stats = useMemo(() => {
    const rows = data ?? [];
    const present = rows.filter((r) => r.status === "present").length;
    const absent = rows.filter((r) => r.status === "absent").length;
    const late = rows.filter((r) => r.status === "late").length;
    const total = rows.length;
    return { present, absent, late, total, rate: total ? Math.round((present / total) * 100) : null };
  }, [data]);
  const go = (d: number) =>
    setCursor((c) => {
      let m = c.m + d, y = c.y;
      if (m < 1) { m = 12; y--; } else if (m > 12) { m = 1; y++; }
      return { y, m };
    });

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => go(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="font-semibold">{monthLabel}</div>
          <Button variant="ghost" size="icon" onClick={() => go(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="py-1 font-medium">{d}</div>
          ))}
        </div>
        {isLoading ? (
          <div className="flex h-48 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : (
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((c, i) => {
              if (c.day == null) return <div key={i} className="h-12" />;
              const date = `${cursor.y}-${String(cursor.m).padStart(2, "0")}-${String(c.day).padStart(2, "0")}`;
              const rec = byDate.get(date);
              const color = rec ? STATUS_COLORS[rec.status] ?? "bg-muted" : "bg-muted/30 text-muted-foreground";
              return (
                <div
                  key={i}
                  title={rec?.remark ?? rec?.status ?? ""}
                  className={cn("flex h-12 items-center justify-center rounded-md text-xs font-medium", color)}
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
        <StatBox label="Rate" value={stats.rate == null ? "—" : `${stats.rate}%`} />
      </div>
    </div>
  );
}

export function ProgressTab({
  studentId,
  program,
}: {
  studentId: string;
  program: "hifz" | "nazra" | null;
}) {
  const { data: subjects } = useSubjectsByProgram(program);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const effective = subjectId ?? subjects?.[0]?.id ?? null;
  const { data: marks, isLoading } = useChildDailyMarks(studentId, effective, 30);

  const summary = useMemo(() => {
    const c: Record<string, number> = { aala: 0, behter: 0, munasib: 0, kamzore: 0, naaga: 0 };
    (marks ?? []).forEach((m) => (c[m.grade] = (c[m.grade] ?? 0) + 1));
    return c;
  }, [marks]);
  const last7 = useMemo(() => {
    const days: { date: string; grade: string | null }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const hit = (marks ?? []).find((m) => m.daily_marks_entries.date === d);
      days.push({ date: d, grade: hit?.grade ?? null });
    }
    return days;
  }, [marks]);

  if (!subjects || subjects.length === 0) {
    return <Card className="p-6 text-sm text-muted-foreground">No subjects configured.</Card>;
  }

  return (
    <Tabs value={effective ?? undefined} onValueChange={setSubjectId}>
      <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-transparent p-0">
        {subjects.map((s) => (
          <TabsTrigger
            key={s.id}
            value={s.id}
            className="rounded-md border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {s.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {subjects.map((s) => (
        <TabsContent key={s.id} value={s.id} className="space-y-4 pt-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold">This week</h3>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <div className="mt-3 grid grid-cols-7 gap-2 text-center text-xs">
                {last7.map((d) => (
                  <div key={d.date} className="flex flex-col items-center gap-1.5">
                    <span className={cn("h-6 w-6 rounded-full", d.grade ? GRADE_DOT[d.grade] : "bg-muted")} />
                    <span className="text-muted-foreground">
                      {new Date(d.date).toLocaleDateString(undefined, { weekday: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card className="p-5">
            <h3 className="text-sm font-semibold">Last 30 days</h3>
            <div className="mt-3 grid grid-cols-5 gap-2 text-center">
              {(["aala", "behter", "munasib", "kamzore", "naaga"] as const).map((g) => (
                <div key={g} className="rounded-md border p-3">
                  <div className={cn("mx-auto h-2.5 w-2.5 rounded-full", GRADE_DOT[g])} />
                  <div className="mt-2 text-lg font-bold">{summary[g] ?? 0}</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{g}</div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function ExamResultsTab({ studentId }: { studentId: string }) {
  const { data: results, isLoading } = useChildExamResults(studentId);
  const { data: subjects } = useSubjects();
  const subjectMap = useMemo(() => new Map((subjects ?? []).map((s) => [s.id, s.name])), [subjects]);
  const grouped = useMemo(() => {
    const map = new Map<string, Array<{ subject: string; marks: number | null; total: number; absent: boolean; date: string }>>();
    (results ?? []).forEach((r) => {
      const arr = map.get(r.exam_marks_entries.exam_name) ?? [];
      arr.push({
        subject: subjectMap.get(r.exam_marks_entries.subject_id) ?? "—",
        marks: r.marks_obtained,
        total: r.exam_marks_entries.total_marks,
        absent: r.is_absent,
        date: r.exam_marks_entries.created_at,
      });
      map.set(r.exam_marks_entries.exam_name, arr);
    });
    return Array.from(map.entries()).sort((a, b) => ((a[1][0]?.date ?? "") < (b[1][0]?.date ?? "") ? 1 : -1));
  }, [results, subjectMap]);

  if (isLoading) return <Card className="p-6"><Loader2 className="h-4 w-4 animate-spin text-primary" /></Card>;
  if (!grouped.length) return <Card className="p-6 text-sm text-muted-foreground">No exam results yet.</Card>;

  return (
    <div className="space-y-4">
      {grouped.map(([exam, rows]) => {
        const obtained = rows.reduce((a, r) => a + (r.absent ? 0 : (r.marks ?? 0)), 0);
        const total = rows.reduce((a, r) => a + r.total, 0);
        const pct = total ? Math.round((obtained / total) * 100) : 0;
        return (
          <Card key={exam} className="p-5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold">{exam}</h3>
              <span className="text-sm text-muted-foreground">{new Date(rows[0].date).toLocaleDateString()}</span>
            </div>
            <Table className="mt-3">
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Obtained</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.subject}</TableCell>
                    <TableCell className="text-right">{r.absent ? "Absent" : (r.marks ?? "—")}</TableCell>
                    <TableCell className="text-right">{r.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
              <span className="font-medium">Overall</span>
              <span><span className="font-bold">{obtained}</span><span className="text-muted-foreground"> / {total}</span><span className="ml-2 text-primary">({pct}%)</span></span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function FeesTab({ studentId }: { studentId: string }) {
  const { data: payments, isLoading } = useChildFeePayments(studentId);
  if (isLoading) return <Card className="p-6"><Loader2 className="h-4 w-4 animate-spin text-primary" /></Card>;
  if (!payments || payments.length === 0) {
    return <Card className="p-6 text-sm text-muted-foreground">No payments recorded yet.</Card>;
  }
  return (
    <Card className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p: any) => (
            <TableRow key={p.id}>
              <TableCell>{p.month}</TableCell>
              <TableCell>{new Date(p.paid_on).toLocaleDateString()}</TableCell>
              <TableCell className="capitalize">{p.method}</TableCell>
              <TableCell className="text-xs">{p.reference_no ?? "—"}</TableCell>
              <TableCell className="text-right">₨{Number(p.amount).toLocaleString()}</TableCell>
              <TableCell className="text-right">
                <Badge className="bg-[color:var(--color-success)]/15 text-[color:var(--color-success)] hover:bg-[color:var(--color-success)]/15">
                  Paid
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}
