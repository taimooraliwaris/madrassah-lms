import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { EntityHeader } from "@/components/EntityHeader";
import { SelectionHeader } from "@/components/operator/SelectionHeader";
import { GradeButtons, type Grade } from "@/components/operator/StatusButtons";
import {
  useClasses,
  useClassRoster,
  useSubjectsByProgram,
  useSubmitDailyMarksMatrix,
} from "@/hooks/queries";

export const Route = createFileRoute("/operator/marks/")({
  component: MarksPage,
});

function MarksPage() {
  return (
    <div>
      <EntityHeader
        title="Daily Performance Entry"
        subtitle="Grade every student across every subject for the selected class and date."
      />
      <Tabs defaultValue="standard">
        <TabsList>
          <TabsTrigger value="standard">Standard</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
        </TabsList>
        <TabsContent value="standard" className="mt-4">
          <StandardMode />
        </TabsContent>
        <TabsContent value="bulk" className="mt-4">
          <BulkMode />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type CellKey = string; // `${studentId}:${subjectId}`
type CellValue = { grade: Grade; reason?: string };

function StandardMode() {
  const today = new Date().toISOString().slice(0, 10);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(today);
  const { data: classes = [] } = useClasses();
  const { data: roster = [] } = useClassRoster(classId);
  const program = classes.find((c) => c.id === classId)?.program ?? null;
  const { data: subjects = [] } = useSubjectsByProgram(program as never);
  const submit = useSubmitDailyMarksMatrix();
  const [cells, setCells] = useState<Record<CellKey, CellValue>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  useEffect(() => {
    setCells({});
    setRemarks({});
  }, [classId, date]);

  const key = (s: string, sub: string): CellKey => `${s}:${sub}`;
  const setGrade = (s: string, sub: string, g: Grade) =>
    setCells((m) => ({ ...m, [key(s, sub)]: { ...m[key(s, sub)], grade: g } }));
  const setReason = (s: string, sub: string, reason: string) =>
    setCells((m) => {
      const prev = m[key(s, sub)] ?? { grade: "munasib" as Grade };
      return { ...m, [key(s, sub)]: { ...prev, reason } };
    });

  const applyAllForSubject = (sub: string, g: Grade) =>
    setCells((m) => {
      const next = { ...m };
      for (const r of roster) next[key(r.id, sub)] = { ...next[key(r.id, sub)], grade: g };
      return next;
    });

  const totalCells = roster.length * subjects.length;
  const filled = useMemo(
    () =>
      roster.reduce(
        (acc, r) => acc + subjects.filter((s) => cells[key(r.id, s.id)]?.grade).length,
        0,
      ),
    [cells, roster, subjects],
  );

  const onSubmit = async () => {
    if (!classId) return toast.error("Select a class");
    if (!subjects.length) return toast.error("No subjects configured for this program");
    if (filled === 0) return toast.error("Grade at least one cell");
    // Naaga reason check
    for (const r of roster) {
      for (const s of subjects) {
        const c = cells[key(r.id, s.id)];
        if (c?.grade === "naaga" && !c?.reason) {
          return toast.error(`Reason required for Naaga (${r.full_name} · ${s.name})`);
        }
      }
    }
    try {
      const payload = subjects
        .map((s) => ({
          subject_id: s.id,
          marks: roster
            .map((r) => {
              const c = cells[key(r.id, s.id)];
              if (!c?.grade) return null;
              return {
                student_id: r.id,
                grade: c.grade,
                reason: c.reason,
                remark: remarks[r.id] || undefined,
              };
            })
            .filter((x): x is NonNullable<typeof x> => x !== null),
        }))
        .filter((s) => s.marks.length > 0);
      await submit.mutateAsync({ class_id: classId, date, subjects: payload });
      toast.success("Marks saved");
      setCells({});
      setRemarks({});
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  return (
    <>
      <SelectionHeader
        classId={classId}
        date={date}
        onClassChange={setClassId}
        onDateChange={setDate}
      />

      {classId && subjects.length > 0 && (
        <Card className="mb-4 p-3 text-xs text-muted-foreground">
          Columns: {subjects.map((s) => s.name).join(" · ")} · Grade each
          student per subject. Quick-fill per subject from each column header.
          <span className="float-right">
            {filled}/{totalCells} cells graded
          </span>
        </Card>
      )}

      {classId && roster.length > 0 && subjects.length > 0 && (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Student</th>
                  {subjects.map((s) => (
                    <th key={s.id} className="px-3 py-2 align-top">
                      <div>{s.name}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(["aala", "behter", "munasib", "kamzore", "naaga"] as Grade[]).map((g) => (
                          <button
                            key={g}
                            onClick={() => applyAllForSubject(s.id, g)}
                            className="rounded border px-1.5 py-0.5 text-[10px] capitalize hover:bg-muted"
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-2">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {roster.map((r, i) => (
                  <tr key={r.id} className="align-top">
                    <td className="px-3 py-2 text-xs text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{r.full_name}</div>
                      <div className="text-xs text-muted-foreground">{r.student_code}</div>
                    </td>
                    {subjects.map((s) => {
                      const c = cells[key(r.id, s.id)];
                      return (
                        <td key={s.id} className="px-3 py-2">
                          <GradeButtons
                            value={c?.grade ?? null}
                            onChange={(g) => setGrade(r.id, s.id, g)}
                          />
                          {c?.grade === "naaga" && (
                            <Input
                              placeholder="Reason"
                              value={c.reason ?? ""}
                              onChange={(e) => setReason(r.id, s.id, e.target.value)}
                              className="mt-1 h-7 border-destructive/40 text-xs"
                            />
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2">
                      <Input
                        placeholder="Optional"
                        value={remarks[r.id] ?? ""}
                        onChange={(e) => setRemarks((m) => ({ ...m, [r.id]: e.target.value }))}
                        className="h-8 w-40"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <div className="sticky bottom-4 mt-4">
            <Card className="flex items-center justify-end gap-3 p-3 shadow-lg">
              <Button onClick={onSubmit} disabled={submit.isPending}>
                {submit.isPending ? "Saving…" : "Save Marks"}
              </Button>
            </Card>
          </div>
        </>
      )}
    </>
  );
}

import { BulkMarks } from "@/components/operator/BulkMarks";

function BulkMode() {
  return <BulkMarks />;
}

