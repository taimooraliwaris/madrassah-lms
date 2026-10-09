import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/forms/Field";
import {
  useClasses,
  usePromoteAdmission,
  useReviewAdmission,
  useTeachers,
  type Admission,
} from "@/hooks/queries";

import { formatDate, programLabel } from "@/lib/format";

export function AdmissionReviewDrawer({
  open,
  onOpenChange,
  admission,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  admission: Admission | null;
}) {
  const review = useReviewAdmission();
  const promote = usePromoteAdmission();
  const { data: classes = [] } = useClasses();
  const { data: teachers = [] } = useTeachers();

  const [note, setNote] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [approval, setApproval] = useState({
    class_id: "",
    teacher_id: "",
    enrollment_date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    setNote(admission?.review_note ?? "");
  }, [admission?.id]);

  const reject = async () => {
    if (!admission) return;
    if (!note.trim()) return toast.error("Please add a reason");
    await review.mutateAsync({
      id: admission.id,
      status: "rejected",
      note: note.trim(),
    });
    toast.success("Admission rejected");
    onOpenChange(false);
  };

  const programClasses = classes.filter(
    (c) => c.program === admission?.program,
  );

  const onClassChange = (id: string) => {
    const cls = classes.find((c) => c.id === id);
    setApproval({
      ...approval,
      class_id: id,
      teacher_id: cls?.primary_teacher_id ?? approval.teacher_id,
    });
  };

  const confirmApprove = async () => {
    if (!admission) return;
    if (!approval.class_id || !approval.teacher_id)
      return toast.error("Class and teacher are required");
    try {
      await promote.mutateAsync({
        admission_id: admission.id,
        class_id: approval.class_id,
        teacher_id: approval.teacher_id,
        enrollment_date: approval.enrollment_date,
      });
      toast.success(`${admission.applicant_name} enrolled`);
      setApproveOpen(false);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to approve");
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Admission review</SheetTitle>
          </SheetHeader>

          {admission && (
            <div className="mt-6 space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">
                    {admission.applicant_name}
                  </h2>
                  <Badge variant="outline">
                    {programLabel(admission.program)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Applied {formatDate(admission.created_at)}
                </p>
              </div>

              <section className="grid gap-3 sm:grid-cols-2 text-sm">
                <Detail label="DOB" value={formatDate(admission.dob)} />
                <Detail label="Gender" value={admission.gender ?? "—"} />
                <Detail
                  label="Parent"
                  value={admission.parent_name}
                  full
                />
                <Detail label="Phone" value={admission.parent_phone} />
                <Detail
                  label="Email"
                  value={admission.parent_email ?? "—"}
                />
                <Detail
                  label="Address"
                  value={admission.address ?? "—"}
                  full
                />
                {admission.notes && (
                  <Detail label="Notes" value={admission.notes} full />
                )}
              </section>

              <Field label="Review note">
                <Textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Required when rejecting"
                />
              </Field>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={reject}
                  disabled={
                    review.isPending || admission.status !== "pending"
                  }
                >
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setApproveOpen(true)}
                  disabled={admission.status !== "pending"}
                >
                  Approve & Create Account
                </Button>
              </div>

              {admission.status !== "pending" && (
                <p className="text-xs text-muted-foreground">
                  This admission is already {admission.status}.
                </p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign class & teacher</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Class" required>
              <Select value={approval.class_id} onValueChange={onClassChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {programClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                  {programClasses.length === 0 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      No classes for this program. Create one first.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Assigned teacher" required>
              <Select
                value={approval.teacher_id}
                onValueChange={(v) =>
                  setApproval({ ...approval, teacher_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>

              </Select>
            </Field>
            <Field label="Enrollment date" required>
              <Input
                type="date"
                value={approval.enrollment_date}
                onChange={(e) =>
                  setApproval({ ...approval, enrollment_date: e.target.value })
                }
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmApprove} disabled={promote.isPending}>
              {promote.isPending ? "Enrolling…" : "Confirm & Enroll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Detail({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  );
}
