import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/forms/Field";
import { EntityHeader } from "@/components/EntityHeader";
import { StudentSearch, type StudentLite } from "@/components/operator/StudentSearch";
import { useSubmitFeePayment } from "@/hooks/queries";

export const Route = createFileRoute("/operator/fees/")({
  component: FeesPage,
});

function FeesPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [student, setStudent] = useState<StudentLite | null>(null);
  const [month, setMonth] = useState(today.slice(0, 7)); // YYYY-MM
  const monthLabel = (() => {
    const [y, m] = month.split("-").map(Number);
    if (!y || !m) return month;
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  })();
  const [amount, setAmount] = useState<number | "">("");
  const [method, setMethod] = useState<"cash" | "bank" | "other">("cash");
  const [ref, setRef] = useState("");
  const [paidOn, setPaidOn] = useState(today);
  const [notes, setNotes] = useState("");
  const submit = useSubmitFeePayment();

  const reset = () => {
    setStudent(null);
    setAmount("");
    setRef("");
    setNotes("");
  };

  const onSubmit = async () => {
    if (!student) return toast.error("Pick a student");
    if (!amount || amount <= 0) return toast.error("Enter amount");
    try {
      await submit.mutateAsync({
        student_id: student.id,
        month,
        amount: Number(amount),
        method,
        reference_no: ref || undefined,
        paid_on: paidOn,
        notes: notes || undefined,
      });
      toast.success("Payment submitted for approval");
      reset();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div>
        <EntityHeader title="Fee Payment Entry" subtitle="Record in-person payments." />
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
            <Field label="Month">
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </Field>
            <Field label="Amount (₨)" required>
              <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))} />
            </Field>
            <Field label="Method">
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={method} onChange={(e) => setMethod(e.target.value as never)}>
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Reference no.">
              <Input value={ref} onChange={(e) => setRef(e.target.value)} disabled={method === "cash"} />
            </Field>
            <Field label="Paid on">
              <Input type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          {student && amount && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
              You are recording <strong>₨{amount}</strong> payment for <strong>{student.full_name}</strong> for <strong>{monthLabel}</strong>.
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={reset}>Clear</Button>
            <Button onClick={onSubmit} disabled={submit.isPending}>
              {submit.isPending ? "Submitting…" : "Submit for Approval"}
            </Button>
          </div>
        </Card>
      </div>
      <aside>
        <Card className="p-4">
          <h3 className="text-sm font-semibold">Today's session</h3>
          <p className="mt-2 text-xs text-muted-foreground">
            Approved totals appear under My Submissions after admin review.
          </p>
        </Card>
      </aside>
    </div>
  );
}
