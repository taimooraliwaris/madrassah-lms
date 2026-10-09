import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FormSection } from "@/components/forms/Field";
import { ParentLinkPicker } from "@/components/forms/ParentLinkPicker";
import {
  useClasses,
  useTeachers,
  useSaveStudent,
  useLinkParent,
  useStudentParents,
  useUnlinkParent,
  type Student,
  type Parent,
} from "@/hooks/queries";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  full_name: z.string().min(2, "Required"),
  father_name: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  cnic: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  program: z.enum(["hifz", "nazra"]),
  class_id: z.string().nullable().optional(),
  assigned_teacher_id: z.string().nullable().optional(),
  enrollment_date: z.string().min(1, "Required"),
  status: z.enum(["active", "inactive", "pending"]),
  previous_madrassah: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type FormVals = z.infer<typeof schema>;

export function StudentForm({ initial }: { initial?: Student | null }) {
  const navigate = useNavigate();
  const save = useSaveStudent();
  const linkParent = useLinkParent();
  const unlinkParent = useUnlinkParent();
  const { data: classes = [] } = useClasses();
  const { data: teachers = [] } = useTeachers();
  const existingLinks = useStudentParents(initial?.id ?? "");

  const [linkedParents, setLinkedParents] = useState<Parent[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          full_name: initial.full_name,
          father_name: initial.father_name,
          dob: initial.dob,
          gender: initial.gender,
          cnic: initial.cnic,
          phone: initial.phone,
          address: initial.address,
          program: initial.program,
          class_id: initial.class_id,
          assigned_teacher_id: initial.assigned_teacher_id,
          enrollment_date: initial.enrollment_date,
          status: initial.status,
          previous_madrassah: initial.previous_madrassah,
          notes: initial.notes,
        }
      : {
          program: "hifz",
          status: "active",
          enrollment_date: new Date().toISOString().slice(0, 10),
        },
  });

  const program = watch("program");

  const onSubmit = async (vals: FormVals) => {
    try {
      const saved = await save.mutateAsync({
        ...(initial?.id ? { id: initial.id } : {}),
        full_name: vals.full_name,
        father_name: vals.father_name || null,
        dob: vals.dob || null,
        gender: vals.gender || null,
        cnic: vals.cnic || null,
        phone: vals.phone || null,
        address: vals.address || null,
        program: vals.program,
        class_id: vals.class_id || null,
        assigned_teacher_id: vals.assigned_teacher_id || null,
        enrollment_date: vals.enrollment_date,
        status: vals.status,
        previous_madrassah: vals.previous_madrassah || null,
        notes: vals.notes || null,
      });

      // Link new parents (only on create — edit uses dedicated UI)
      if (!initial?.id && saved?.id) {
        for (let i = 0; i < linkedParents.length; i++) {
          await linkParent.mutateAsync({
            student_id: saved.id,
            parent_id: linkedParents[i].id,
            is_primary: i === 0,
          });
        }
      }

      toast.success(initial?.id ? "Student updated" : "Student created");
      navigate({
        to: "/admin/students/$studentId",
        params: { studentId: saved.id },
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    }
  };

  const filteredClasses = classes.filter((c) => c.program === program);

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection
          title="Identity"
          description="Basic personal information"
        >
          <Field label="Full Name" required error={errors.full_name?.message}>
            <Input {...register("full_name")} />
          </Field>
          <Field label="Father's Name">
            <Input {...register("father_name")} />
          </Field>
          <Field label="Date of Birth">
            <Input type="date" {...register("dob")} />
          </Field>
          <Field label="Gender">
            <Select
              value={watch("gender") ?? ""}
              onValueChange={(v) => setValue("gender", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="CNIC / B-Form #">
            <Input {...register("cnic")} />
          </Field>
          <Field label="Phone">
            <Input {...register("phone")} />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Textarea rows={2} {...register("address")} />
          </Field>
        </FormSection>

        <FormSection
          title="Academic"
          description="Program and class assignment"
        >
          <Field label="Program" required>
            <Select
              value={program}
              onValueChange={(v) => setValue("program", v as "hifz" | "nazra")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hifz">Hifz</SelectItem>
                <SelectItem value="nazra">Nazra</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status" required>
            <Select
              value={watch("status")}
              onValueChange={(v) =>
                setValue("status", v as "active" | "inactive" | "pending")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Class">
            <Select
              value={watch("class_id") ?? ""}
              onValueChange={(v) => setValue("class_id", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {filteredClasses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
                {filteredClasses.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    No classes in this program yet
                  </div>
                )}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Assigned Teacher">
            <Select
              value={watch("assigned_teacher_id") ?? ""}
              onValueChange={(v) => setValue("assigned_teacher_id", v)}
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
          <Field label="Enrollment Date" required>
            <Input type="date" {...register("enrollment_date")} />
          </Field>
          <Field label="Previous Madrassah">
            <Input {...register("previous_madrassah")} />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea rows={2} {...register("notes")} />
          </Field>
        </FormSection>

        {!initial?.id && (
          <FormSection
            title="Parents / Guardians"
            description="Link existing parent or add a new one. First parent becomes primary."
          >
            <div className="sm:col-span-2">
              <ParentLinkPicker
                selected={linkedParents}
                onPick={(p) =>
                  setLinkedParents((s) =>
                    s.find((x) => x.id === p.id) ? s : [...s, p],
                  )
                }
                onRemove={(id) =>
                  setLinkedParents((s) => s.filter((x) => x.id !== id))
                }
              />
            </div>
          </FormSection>
        )}

        {initial?.id && (
          <FormSection title="Linked parents">
            <div className="sm:col-span-2 space-y-2">
              {(existingLinks.data ?? []).map((row: any) => (
                <div
                  key={row.parent.id}
                  className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {row.parent.full_name}
                      {row.is_primary && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {row.parent.relation} · {row.parent.phone}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() =>
                      unlinkParent.mutate({
                        student_id: initial.id,
                        parent_id: row.parent.id,
                      })
                    }
                  >
                    Unlink
                  </Button>
                </div>
              ))}
              <ParentLinkPicker
                selected={[]}
                onPick={async (p) => {
                  await linkParent.mutateAsync({
                    student_id: initial.id,
                    parent_id: p.id,
                  });
                  toast.success("Parent linked");
                }}
                onRemove={() => {}}
              />
            </div>
          </FormSection>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/admin/students" })}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || save.isPending}>
            {isSubmitting || save.isPending ? "Saving…" : "Save Student"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// silence "unused" if supabase import becomes unnecessary later
void supabase;
