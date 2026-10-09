import { createFileRoute } from "@tanstack/react-router";
import { EntityHeader } from "@/components/EntityHeader";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminExams } from "@/hooks/queries";
import { QuranicVerseCard } from "@/components/QuranicVerseCard";

export const Route = createFileRoute("/admin/exams")({
  component: AdminExams,
});

function AdminExams() {
  const { data, isLoading } = useAdminExams();
  const totalExams = data?.length ?? 0;
  const totalStudents = (data ?? []).reduce((s, g) => s + g.students, 0);
  return (
    <div className="space-y-5">
      <EntityHeader
        title="Examinations"
        subtitle={
          totalExams > 0
            ? `${totalExams} exam${totalExams === 1 ? "" : "s"} · ${totalStudents} student entries`
            : "Approved exam entries grouped by exam name."
        }
      />
      <QuranicVerseCard context="exams" variant="inline" />
      <Card className="p-0">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : !data || data.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No exam results yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead className="text-right">Subjects</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Pass rate</TableHead>
                <TableHead className="text-right">Class average</TableHead>
                <TableHead>Latest entry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((g) => {
                const pct = g.students ? Math.round((g.pass / g.students) * 100) : 0;
                const avg = g.total_marks_sum
                  ? Math.round((g.obtained_sum / g.total_marks_sum) * 100)
                  : 0;
                return (
                  <TableRow key={g.exam_name}>
                    <TableCell className="font-medium">{g.exam_name}</TableCell>
                    <TableCell className="text-right">{g.entries}</TableCell>
                    <TableCell className="text-right">{g.students}</TableCell>
                    <TableCell className="text-right">{pct}%</TableCell>
                    <TableCell className="text-right font-semibold">{avg}%</TableCell>
                    <TableCell>{new Date(g.latest).toLocaleDateString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
