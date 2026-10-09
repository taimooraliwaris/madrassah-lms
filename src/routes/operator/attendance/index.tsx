import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { EntityHeader } from "@/components/EntityHeader";
import { SelectionHeader } from "@/components/operator/SelectionHeader";
import { AttendanceButtons, type Att } from "@/components/operator/StatusButtons";
import { useClassRoster, useSubmitAttendance } from "@/hooks/queries";

export const Route = createFileRoute("/operator/attendance/")({
  component: AttendancePage,
});

function AttendancePage() {
  return (
    <div>
      <EntityHeader
        title="Daily Attendance Entry"
        subtitle="Mark today's attendance class-by-class. Submissions go to Admin for verification."
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

function StandardMode() {
  const today = new Date().toISOString().slice(0, 10);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const { data: roster = [], isLoading } = useClassRoster(classId);
  const submit = useSubmitAttendance();
  const [marks, setMarks] = useState<Record<string, { status: Att; remark?: string }>>({});

  const ensureDefaults = () => {
    if (!roster.length) return;
    setMarks((m) => {
      const next = { ...m };
      for (const r of roster) {
        if (!next[r.id]) next[r.id] = { status: "present" };
      }
      return next;
    });
  };

  const tally = useMemo(() => {
    const t = { present: 0, absent: 0, late: 0, excused: 0 };
    for (const r of roster) {
      const s = marks[r.id]?.status ?? "present";
      t[s] += 1;
    }
    return t;
  }, [marks, roster]);

  const setStatus = (id: string, status: Att) =>
    setMarks((m) => ({ ...m, [id]: { ...m[id], status } }));
  const setRemark = (id: string, remark: string) =>
    setMarks((m) => ({ ...m, [id]: { ...m[id], status: m[id]?.status ?? "present", remark } }));

  const onSubmit = async () => {
    if (!classId || !roster.length) {
      toast.error("Select a class first");
      return;
    }
    try {
      await submit.mutateAsync({
        class_id: classId,
        date,
        note: note || undefined,
        marks: roster.map((r) => ({
          student_id: r.id,
          status: marks[r.id]?.status ?? "present",
          remark: marks[r.id]?.remark || undefined,
        })),
      });
      toast.success("Attendance submitted for approval");
      setMarks({});
      setNote("");
    } catch (e: any) {
      toast.error(e?.message ?? "Submit failed");
    }
  };

  return (
    <>
      <SelectionHeader
        classId={classId}
        date={date}
        onClassChange={(v) => {
          setClassId(v);
          setMarks({});
        }}
        onDateChange={setDate}
        extra={
          <Button variant="outline" onClick={ensureDefaults} disabled={!classId || isLoading}>
            Load Roster
          </Button>
        }
      />

      {classId && roster.length > 0 && (
        <>
          <Card className="overflow-hidden">
            <div className="border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
              P = Present · A = Absent · L = Late · E = Excused. Default: Present.
            </div>
            <div className="divide-y">
              {roster.map((r, i) => {
                const m = marks[r.id]?.status ?? "present";
                const needsRemark = m === "absent" || m === "late";
                return (
                  <div
                    key={r.id}
                    className={`grid grid-cols-[40px_1fr_auto_220px] items-center gap-3 px-4 py-2 ${
                      m === "absent" ? "bg-destructive/5" : ""
                    }`}
                  >
                    <span className="text-xs text-muted-foreground">{i + 1}</span>
                    <div>
                      <div className="text-sm font-medium">{r.full_name}</div>
                      <div className="text-xs text-muted-foreground">{r.student_code}</div>
                    </div>
                    <AttendanceButtons value={m} onChange={(s) => setStatus(r.id, s)} />
                    <Input
                      placeholder={needsRemark ? "Reason (required)" : "Remarks"}
                      value={marks[r.id]?.remark ?? ""}
                      onChange={(e) => setRemark(r.id, e.target.value)}
                      className="h-8"
                    />
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="sticky bottom-4 mt-4">
            <Card className="flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-card p-4 shadow-lg">
              <div className="flex flex-wrap gap-4 text-sm">
                <span>Present: <strong>{tally.present}</strong></span>
                <span className="text-destructive">Absent: <strong>{tally.absent}</strong></span>
                <span>Late: <strong>{tally.late}</strong></span>
                <span>Excused: <strong>{tally.excused}</strong></span>
                <span className="text-muted-foreground">Total: {roster.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Textarea
                  placeholder="Optional note for admin"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={1}
                  className="h-9 w-56 min-h-9 resize-none"
                />
                <Button onClick={onSubmit} disabled={submit.isPending}>
                  {submit.isPending ? "Submitting…" : "Submit for Approval"}
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}

      {classId && !isLoading && !roster.length && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No active students in this class.
        </Card>
      )}
    </>
  );
}

import { BulkAttendance } from "@/components/operator/BulkAttendance";

function BulkMode() {
  return <BulkAttendance />;
}

