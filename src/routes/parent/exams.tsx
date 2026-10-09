import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSelectedChild } from "@/contexts/SelectedChildContext";
import { useChildExamResults, useSubjects } from "@/hooks/queries";

export const Route = createFileRoute("/parent/exams")({
  component: ParentExams,
});

function ParentExams() {
  const { selectedChild } = useSelectedChild();
  const { data: results, isLoading } = useChildExamResults(
    selectedChild?.id ?? null,
  );
  const { data: subjects } = useSubjects();
  const subjectMap = useMemo(
    () => new Map((subjects ?? []).map((s) => [s.id, s.name])),
    [subjects],
  );

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      Array<{
        subject: string;
        marks: number | null;
        total: number;
        absent: boolean;
        date: string;
      }>
    >();
    (results ?? []).forEach((r) => {
      const key = r.exam_marks_entries.exam_name;
      const arr = map.get(key) ?? [];
      arr.push({
        subject: subjectMap.get(r.exam_marks_entries.subject_id) ?? "—",
        marks: r.marks_obtained,
        total: r.exam_marks_entries.total_marks,
        absent: r.is_absent,
        date: r.exam_marks_entries.created_at,
      });
      map.set(key, arr);
    });
    return Array.from(map.entries()).sort((a, b) =>
      (a[1][0]?.date ?? "") < (b[1][0]?.date ?? "") ? 1 : -1,
    );
  }, [results, subjectMap]);

  if (!selectedChild) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Select a child to view exam results.
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Exam Results</h1>
        <p className="text-sm text-muted-foreground">
          Results published after admin verification.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : grouped.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No exam results yet.
        </Card>
      ) : (
        grouped.map(([exam, rows]) => {
          const obtained = rows.reduce(
            (a, r) => a + (r.absent ? 0 : (r.marks ?? 0)),
            0,
          );
          const total = rows.reduce((a, r) => a + r.total, 0);
          const pct = total ? Math.round((obtained / total) * 100) : 0;
          return (
            <Card key={exam} className="p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">{exam}</h2>
                <div className="text-sm text-muted-foreground">
                  {new Date(rows[0].date).toLocaleDateString()}
                </div>
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
                      <TableCell className="text-right">
                        {r.absent ? "Absent" : (r.marks ?? "—")}
                      </TableCell>
                      <TableCell className="text-right">{r.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
                <span className="font-medium">Overall</span>
                <span>
                  <span className="font-bold">{obtained}</span>
                  <span className="text-muted-foreground"> / {total}</span>
                  <span className="ml-2 text-primary">({pct}%)</span>
                </span>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
