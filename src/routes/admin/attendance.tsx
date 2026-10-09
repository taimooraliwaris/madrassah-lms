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
  useAdminAttendanceByDate,
  useClasses,
  useLatestAttendanceDate,
} from "@/hooks/queries";

import { QuranicVerseCard } from "@/components/QuranicVerseCard";

export const Route = createFileRoute("/admin/attendance")({
  component: AdminAttendance,
});

function AdminAttendance() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: latest, isLoading: isLoadingLatest } = useLatestAttendanceDate();
  const [override, setOverride] = useState<string | null>(null);
  const date = override ?? (isLoadingLatest ? null : latest ?? today);
  const dateInputValue = date ?? latest ?? today;
  const [classId, setClassId] = useState<string>("");
  const { data: classes = [] } = useClasses();
  const { data, isLoading: isLoadingData } = useAdminAttendanceByDate(date, classId || undefined);
  const isPageLoading = (isLoadingLatest && !override) || isLoadingData;

  return (
    <div className="space-y-5">
      <EntityHeader title="Attendance Overview" subtitle="Daily attendance recorded by operators." />
      <QuranicVerseCard context="attendance" variant="inline" />
      <Card className="flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground">Date</label>
          <Input type="date" value={dateInputValue} onChange={(e) => setOverride(e.target.value)} className="mt-1 h-9 w-44" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground">Class</label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="mt-1 h-9 w-56 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="p-0">
        {isPageLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : !data || data.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No attendance recorded for this date.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Present</TableHead>
                <TableHead className="text-right">Absent</TableHead>
                <TableHead className="text-right">Late</TableHead>
                <TableHead className="text-right">Excused</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.class_name}</TableCell>
                  <TableCell className="text-right">{r.present}</TableCell>
                  <TableCell className="text-right text-destructive">{r.absent}</TableCell>
                  <TableCell className="text-right">{r.late}</TableCell>
                  <TableCell className="text-right">{r.excused}</TableCell>
                  <TableCell className="text-right">{r.total}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {r.rate == null ? "—" : `${r.rate}%`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
