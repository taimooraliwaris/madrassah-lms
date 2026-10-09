import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/forms/Field";
import { EntityHeader } from "@/components/EntityHeader";
import { SelectionHeader } from "@/components/operator/SelectionHeader";
import {
  useClasses,
  useClassRoster,
  useSubjectsByProgram,
  useSubmitExamMarks,
} from "@/hooks/queries";

export const Route = createFileRoute("/operator/exams/")({
  component: ExamPage,
});

function ExamPage() {
  const [classId, setClassId] = useState("");
  const [examName, setExamName] = useState("");
  const [total, setTotal] = useState(100);
  const { data: classes = [] } = useClasses();
  const program = classes.find((c) => c.id === classId)?.program ?? null;
  const { data: subjects = [] } = useSubjectsByProgram(program as never);
  const [subjectId, setSubjectId] = useState("");
  const { data: roster = [] } = useClassRoster(classId);
  useEffect(() => setSubjectId(subjects[0]?.id ?? ""), [subjects]);
  const submit = useSubmitExamMarks();

  const [marks, setMarks] = useState<Record<string, { marks_obtained: number | null; is_absent: boolean }>>({});
  const setMark = (id: string, v: number | null) =>
    setMarks((m) => ({ ...m, [id]: { is_absent: m[id]?.is_absent ?? false, marks_obtained: v } }));
  const setAbsent = (id: string, b: boolean) =>
    setMarks((m) => ({ ...m, [id]: { marks_obtained: b ? null : m[id]?.marks_obtained ?? null, is_absent: b } }));


  const stats = useMemo(() => {
    const vals = roster
      .map((r) => marks[r.id])
      .filter((m) => m && !m.is_absent && typeof m.marks_obtained === "number") as {
      marks_obtained: number;
    }[];
    if (!vals.length) return null;
    const v = vals.map((x) => x.marks_obtained);
    const avg = v.reduce((s, x) => s + x, 0) / v.length;
    const pass = v.filter((x) => x >= total * 0.4).length;
    return { avg: Math.round(avg), hi: Math.max(...v), lo: Math.min(...v), pass, fail: v.length - pass };
  }, [marks, roster, total]);

  const onSubmit = async () => {
    if (!examName || !classId || !subjectId) return toast.error("Fill exam, class, subject");
    try {
      await submit.mutateAsync({
        exam_name: examName,
        class_id: classId,
        subject_id: subjectId,
        total_marks: total,
        marks: roster.map((r) => ({
          student_id: r.id,
          marks_obtained: marks[r.id]?.is_absent ? null : marks[r.id]?.marks_obtained ?? null,
          is_absent: !!marks[r.id]?.is_absent,
        })),
      });
      toast.success("Exam marks submitted for approval");
      setMarks({});
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  return (
    <div>
      <EntityHeader title="Exam Marks Entry" subtitle="Marks become visible to parents only after approval." />

      <SelectionHeader classId={classId} date="" onClassChange={setClassId} />

      <Card className="mb-4 grid gap-3 p-4 sm:grid-cols-3">
        <Field label="Exam name" required>
          <Input value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="e.g. Monthly Test — May 2026" />
        </Field>
        <Field label="Subject">
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">—</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Total marks">
          <Input type="number" min={1} value={total} onChange={(e) => setTotal(Number(e.target.value) || 100)} />
        </Field>
      </Card>

      {classId && roster.length > 0 && subjectId && (
        <>
          <Card className="overflow-hidden">
            <div className="divide-y">
              {roster.map((r, i) => {
                const m = marks[r.id];
                const overflow = typeof m?.marks_obtained === "number" && m.marks_obtained > total;
                return (
                  <div key={r.id} className="grid grid-cols-[40px_1fr_140px_120px_80px] items-center gap-3 px-4 py-2">
                    <span className="text-xs text-muted-foreground">{i + 1}</span>
                    <div>
                      <div className="text-sm font-medium">{r.full_name}</div>
                      <div className="text-xs text-muted-foreground">{r.student_code}</div>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={total}
                      disabled={m?.is_absent}
                      value={m?.marks_obtained ?? ""}
                      onChange={(e) => setMark(r.id, e.target.value === "" ? null : Number(e.target.value))}
                      placeholder={m?.is_absent ? "ABS" : "Marks"}
                      className={`h-9 ${overflow ? "border-destructive" : ""}`}
                    />
                    <label className="flex items-center gap-2 text-xs">
                      <Checkbox checked={!!m?.is_absent} onCheckedChange={(v) => setAbsent(r.id, !!v)} />
                      Absent
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {m?.is_absent ? "—" : typeof m?.marks_obtained === "number" ? `${Math.round((m.marks_obtained / total) * 100)}%` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {stats && (
            <Card className="mt-4 grid grid-cols-2 gap-2 p-3 text-xs sm:grid-cols-5">
              <Stat l="Average" v={stats.avg} />
              <Stat l="Highest" v={stats.hi} />
              <Stat l="Lowest" v={stats.lo} />
              <Stat l="Pass" v={stats.pass} />
              <Stat l="Fail" v={stats.fail} />
            </Card>
          )}

          <div className="sticky bottom-4 mt-4 flex justify-end">
            <Button onClick={onSubmit} disabled={submit.isPending}>
              {submit.isPending ? "Submitting…" : "Submit for Approval"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ l, v }: { l: string; v: number }) {
  return (
    <div className="rounded-md border bg-card p-2 text-center">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{l}</div>
      <div className="text-base font-semibold">{v}</div>
    </div>
  );
}
