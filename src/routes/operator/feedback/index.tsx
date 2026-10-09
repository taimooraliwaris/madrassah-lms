import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field } from "@/components/forms/Field";
import { EntityHeader } from "@/components/EntityHeader";
import { SelectionHeader } from "@/components/operator/SelectionHeader";
import { StudentSearch, type StudentLite } from "@/components/operator/StudentSearch";
import { useSubmitRemark } from "@/hooks/queries";

export const Route = createFileRoute("/operator/feedback/")({
  component: FeedbackPage,
});

const CATEGORIES = ["Academic", "Behavioral", "Attendance", "Memorization", "Discipline", "Other"];
const SEVERITIES = ["Info", "Concern", "Serious"];

function FeedbackPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(today);

  return (
    <div>
      <EntityHeader
        title="Feedback & Remarks Entry"
        subtitle="Transcribe teacher remarks from physical registers."
      />
      <SelectionHeader classId={classId} date={date} onClassChange={setClassId} onDateChange={setDate} />
      <Tabs defaultValue="individual">
        <TabsList>
          <TabsTrigger value="individual">Individual Student</TabsTrigger>
          <TabsTrigger value="class">Class-wide</TabsTrigger>
        </TabsList>
        <TabsContent value="individual" className="mt-4">
          <IndividualForm classId={classId} date={date} />
        </TabsContent>
        <TabsContent value="class" className="mt-4">
          <ClassForm classId={classId} date={date} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IndividualForm({ classId, date }: { classId: string; date: string }) {
  const [student, setStudent] = useState<StudentLite | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [severity, setSeverity] = useState(SEVERITIES[0]);
  const [body, setBody] = useState("");
  const submit = useSubmitRemark();

  const onSubmit = async () => {
    if (!classId) return toast.error("Select a class");
    if (!student) return toast.error("Pick a student");
    if (!body.trim()) return toast.error("Write the remark");
    try {
      await submit.mutateAsync({
        class_id: classId,
        date,
        scope: "individual",
        student_id: student.id,
        category,
        severity,
        body,
      });
      toast.success("Remark submitted for approval");
      setBody("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  return (
    <Card className="space-y-4 p-5">
      <Field label="Student" required>
        <StudentSearch onPick={setStudent} />
      </Field>
      {student && (
        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <strong>{student.full_name}</strong>{" "}
          <span className="text-muted-foreground">· {student.student_code} · {student.program}</span>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Category">
          <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Severity">
          <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Remark" required>
        <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
      </Field>
      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={submit.isPending}>Submit for Approval</Button>
      </div>
    </Card>
  );
}

function ClassForm({ classId, date }: { classId: string; date: string }) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [body, setBody] = useState("");
  const submit = useSubmitRemark();
  const onSubmit = async () => {
    if (!classId) return toast.error("Select a class");
    if (!body.trim()) return toast.error("Write the remark");
    try {
      await submit.mutateAsync({ class_id: classId, date, scope: "class", category, body });
      toast.success("Class remark submitted");
      setBody("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };
  return (
    <Card className="space-y-4 p-5">
      <Field label="Category">
        <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Remark" required>
        <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
      </Field>
      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={submit.isPending}>Submit for Approval</Button>
      </div>
    </Card>
  );
}
