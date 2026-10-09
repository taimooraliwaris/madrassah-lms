import { Card } from "@/components/ui/card";
import { Field } from "@/components/forms/Field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClasses } from "@/hooks/queries";

export function SelectionHeader({
  classId,
  date,
  onClassChange,
  onDateChange,
  extra,
}: {
  classId: string;
  date: string;
  onClassChange: (v: string) => void;
  onDateChange?: (v: string) => void;
  extra?: React.ReactNode;
}) {
  const { data: classes = [] } = useClasses();
  const cls = classes.find((c) => c.id === classId);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Card className="sticky top-0 z-10 mb-4 p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
        <Field label="Class">
          <Select value={classId} onValueChange={onClassChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} · {c.program}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {onDateChange && (
          <Field label="Date">
            <Input
              type="date"
              max={today}
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
            />
          </Field>
        )}
        <div className="flex items-end">{extra}</div>
      </div>
      {cls && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>
            Class: <span className="font-medium text-foreground">{cls.name}</span>
          </span>
          <span>
            Program: <span className="font-medium capitalize text-foreground">{cls.program}</span>
          </span>
          <span>
            Teacher: <span className="font-medium text-foreground">{cls.teacher?.full_name ?? "—"}</span>
          </span>
        </div>
      )}
    </Card>
  );
}
