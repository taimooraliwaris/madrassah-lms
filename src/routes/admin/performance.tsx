import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { EntityHeader } from "@/components/EntityHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdminPerformance,
  useClasses,
  useSubjects,
  useLatestPerformanceDate,
} from "@/hooks/queries";
import { QuranicVerseCard } from "@/components/QuranicVerseCard";

export const Route = createFileRoute("/admin/performance")({
  component: AdminPerformance,
});

function AdminPerformance() {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const defaultFrom = new Date(today.getTime() - 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const { data: latest, isLoading: isLoadingLatest } = useLatestPerformanceDate();
  const effectiveTo = isLoadingLatest ? null : latest ?? to;
  const effectiveFrom = isLoadingLatest
    ? null
    : latest
    ? new Date(new Date(latest).getTime() - 30 * 86400000)
        .toISOString()
        .slice(0, 10)
    : defaultFrom;
  const [override, setOverride] = useState<{ from: string; to: string } | null>(null);
  const range = override ?? { from: effectiveFrom, to: effectiveTo };
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data, isLoading } = useAdminPerformance(
    range.from,
    range.to,
    classId || undefined,
    subjectId || undefined,
  );
  const isPageLoading = (isLoadingLatest && !override) || isLoading;

  return (
    <div className="space-y-5">
      <EntityHeader title="Performance Overview" subtitle="Daily grades captured by operators." />
      <QuranicVerseCard context="performance" variant="inline" />
      <Card className="flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground">From</label>
          <Input type="date" value={range.from ?? defaultFrom} onChange={(e) => setOverride({ from: e.target.value, to: range.to ?? to })} className="mt-1 h-9 w-40" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground">To</label>
          <Input type="date" value={range.to ?? to} onChange={(e) => setOverride({ from: range.from ?? defaultFrom, to: e.target.value })} className="mt-1 h-9 w-40" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground">Class</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="mt-1 h-9 w-48 rounded-md border bg-background px-3 text-sm">
            <option value="">All</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground">Subject</label>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="mt-1 h-9 w-48 rounded-md border bg-background px-3 text-sm">
            <option value="">All</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </Card>

      <Card className="p-0">
        {isPageLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : !data || data.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No grades found for the selected filters.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-right">Aala</TableHead>
                <TableHead className="text-right">Behter</TableHead>
                <TableHead className="text-right">Munasib</TableHead>
                <TableHead className="text-right">Kamzore</TableHead>
                <TableHead className="text-right">Naaga</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.date}</TableCell>
                  <TableCell className="font-medium">{r.class_name}</TableCell>
                  <TableCell>{r.subject_name}</TableCell>
                  <TableCell className="text-right">{r.aala}</TableCell>
                  <TableCell className="text-right">{r.behter}</TableCell>
                  <TableCell className="text-right">{r.munasib}</TableCell>
                  <TableCell className="text-right">{r.kamzore}</TableCell>
                  <TableCell className="text-right text-destructive">{r.naaga}</TableCell>
                  <TableCell className="text-right font-semibold">{r.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
