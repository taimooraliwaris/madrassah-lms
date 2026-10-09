import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, FileText } from "lucide-react";
import { EntityHeader } from "@/components/EntityHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/forms/Field";
import { StudentSearch, type StudentLite } from "@/components/operator/StudentSearch";
import {
  usePtmReports,
  useCreatePtmReport,
  useDeletePtmReport,
} from "@/hooks/queries";

export const Route = createFileRoute("/admin/ptm")({
  component: AdminPtm,
});

function AdminPtm() {
  const { data: reports, isLoading } = usePtmReports();
  const create = useCreatePtmReport();
  const del = useDeletePtmReport();
  const [open, setOpen] = useState(false);
  const [student, setStudent] = useState<StudentLite | null>(null);
  const [period, setPeriod] = useState("");
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [summary, setSummary] = useState("");
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [actionItems, setActionItems] = useState("");

  const reset = () => {
    setStudent(null);
    setPeriod("");
    setSummary("");
    setStrengths("");
    setImprovements("");
    setActionItems("");
  };

  const submit = async () => {
    if (!student) return toast.error("Pick a student");
    if (!period.trim()) return toast.error("Enter a period");
    try {
      await create.mutateAsync({
        student_id: student.id,
        period: period.trim(),
        meeting_date: meetingDate,
        summary: summary || undefined,
        strengths: strengths || undefined,
        improvements: improvements || undefined,
        action_items: actionItems || undefined,
      });
      toast.success("PTM report created");
      reset();
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  return (
    <div className="space-y-4">
      <EntityHeader
        title="PTM & Reports"
        subtitle="Create Parent-Teacher Meeting summaries. Parents can download these as PDF."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>New PTM report</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Field label="Student" required>
                  <StudentSearch onPick={setStudent} />
                </Field>
                {student && (
                  <div className="rounded-md border bg-muted/30 p-2 text-sm">
                    {student.full_name} · {student.student_code}
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Period" required>
                    <Input
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      placeholder="e.g. May 2026"
                    />
                  </Field>
                  <Field label="Meeting date">
                    <Input
                      type="date"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="Summary">
                  <Textarea
                    rows={3}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </Field>
                <Field label="Strengths">
                  <Textarea
                    rows={2}
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                  />
                </Field>
                <Field label="Areas for improvement">
                  <Textarea
                    rows={2}
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                  />
                </Field>
                <Field label="Action items">
                  <Textarea
                    rows={2}
                    value={actionItems}
                    onChange={(e) => setActionItems(e.target.value)}
                  />
                </Field>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={submit} disabled={create.isPending}>
                    {create.isPending ? "Saving…" : "Save report"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : !reports || reports.length === 0 ? (
        <Card className="p-10 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-3 font-semibold">No PTM reports yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first PTM summary to share with parents.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {reports.map((r: any) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">
                    {r.students?.full_name ?? "Student"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {r.period}
                    {r.meeting_date &&
                      ` · ${new Date(r.meeting_date).toLocaleDateString()}`}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Delete this report?")) del.mutate(r.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {r.summary && (
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {r.summary}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
