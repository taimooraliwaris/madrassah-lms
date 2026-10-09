import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/forms/Field";
import {
  useSaveClass,
  useTeachers,
  type Class as ClassRow,
} from "@/hooks/queries";

export function ClassFormDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: ClassRow | null;
}) {
  const save = useSaveClass();
  const { data: teachers = [] } = useTeachers();
  const [form, setForm] = useState({
    name: "",
    program: "hifz" as "hifz" | "nazra",
    academic_year: "2024-2025",
    primary_teacher_id: "",
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? "",
        program: (initial?.program ?? "hifz") as "hifz" | "nazra",
        academic_year: initial?.academic_year ?? "2024-2025",
        primary_teacher_id: initial?.primary_teacher_id ?? "",
        status: ((initial?.status as any) ?? "active") as "active" | "inactive",
      });
    }
  }, [open, initial]);

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Class name is required");
    try {
      await save.mutateAsync({
        ...(initial?.id ? { id: initial.id } : {}),
        name: form.name.trim(),
        program: form.program,
        academic_year: form.academic_year,
        primary_teacher_id: form.primary_teacher_id || null,
        status: form.status as any,
      });
      toast.success(initial ? "Class updated" : "Class created");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit class" : "New class"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Class name" required className="sm:col-span-2">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Hifz Level 3"
            />
          </Field>
          <Field label="Program" required>
            <Select
              value={form.program}
              onValueChange={(v) =>
                setForm({ ...form, program: v as "hifz" | "nazra" })
              }
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
          <Field label="Academic year">
            <Input
              value={form.academic_year}
              onChange={(e) =>
                setForm({ ...form, academic_year: e.target.value })
              }
            />
          </Field>
          <Field label="Primary teacher">
            <Select
              value={form.primary_teacher_id || "_"}
              onValueChange={(v) =>
                setForm({ ...form, primary_teacher_id: v === "_" ? "" : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_">None</SelectItem>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm({ ...form, status: v as "active" | "inactive" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending ? "Saving…" : initial ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
