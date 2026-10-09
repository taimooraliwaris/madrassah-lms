import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FormSection } from "@/components/forms/Field";
import {
  useClasses,
  useSaveTeacher,
  useSetTeacherClasses,
  useTeacherClassIds,
  type Teacher,
} from "@/hooks/queries";

const schema = z.object({
  full_name: z.string().min(2, "Required"),
  father_name: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  cnic: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  emergency_contact: z.string().optional().nullable(),
  qualification: z.string().optional().nullable(),
  experience_years: z.coerce.number().int().min(0).optional().nullable(),
  specializations: z.string().optional(),
  joining_date: z.string().optional().nullable(),
  employment_status: z.enum(["active", "on_leave", "resigned"]),
});

type FormVals = z.infer<typeof schema>;

export function TeacherForm({ initial }: { initial?: Teacher | null }) {
  const navigate = useNavigate();
  const save = useSaveTeacher();
  const setClasses = useSetTeacherClasses();
  const { data: classes = [] } = useClasses();
  const existingClassIds = useTeacherClassIds(initial?.id ?? "");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  useEffect(() => {
    if (existingClassIds.data) setSelectedClasses(existingClassIds.data);
  }, [existingClassIds.data]);

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
          emergency_contact: initial.emergency_contact,
          qualification: initial.qualification,
          experience_years: initial.experience_years ?? 0,
          specializations: (initial.specializations ?? []).join(", "),
          joining_date: initial.joining_date,
          employment_status: initial.employment_status,
        }
      : { employment_status: "active", experience_years: 0 },
  });

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
        emergency_contact: vals.emergency_contact || null,
        qualification: vals.qualification || null,
        experience_years: vals.experience_years ?? 0,
        specializations: (vals.specializations ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        joining_date: vals.joining_date || null,
        employment_status: vals.employment_status,
      });
      if (saved?.id) {
        await setClasses.mutateAsync({
          teacher_id: saved.id,
          class_ids: selectedClasses,
        });
      }
      toast.success(initial?.id ? "Teacher updated" : "Teacher created");
      navigate({ to: "/admin/teachers" });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    }
  };

  const toggleClass = (id: string) =>
    setSelectedClasses((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Identity">
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
          <Field label="CNIC">
            <Input {...register("cnic")} />
          </Field>
          <Field label="Phone">
            <Input {...register("phone")} />
          </Field>
          <Field label="Emergency Contact" className="sm:col-span-2">
            <Input {...register("emergency_contact")} />
          </Field>
        </FormSection>

        <FormSection title="Professional">
          <Field label="Qualification">
            <Input {...register("qualification")} />
          </Field>
          <Field label="Experience (years)">
            <Input
              type="number"
              min={0}
              {...register("experience_years", { valueAsNumber: true })}
            />
          </Field>
          <Field
            label="Specializations"
            hint="Comma-separated (e.g. Tajweed, Tafseer)"
            className="sm:col-span-2"
          >
            <Input {...register("specializations")} />
          </Field>
          <Field label="Joining Date">
            <Input type="date" {...register("joining_date")} />
          </Field>
          <Field label="Employment Status" required>
            <Select
              value={watch("employment_status")}
              onValueChange={(v) =>
                setValue(
                  "employment_status",
                  v as "active" | "on_leave" | "resigned",
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="resigned">Resigned</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FormSection>

        <FormSection title="Class Assignments">
          <div className="sm:col-span-2">
            {classes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No classes yet — add classes first.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {classes.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={selectedClasses.includes(c.id)}
                      onCheckedChange={() => toggleClass(c.id)}
                    />
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {c.program === "hifz" ? "Hifz" : "Nazra"}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </FormSection>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/admin/teachers" })}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || save.isPending}>
            {isSubmitting || save.isPending ? "Saving…" : "Save Teacher"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
