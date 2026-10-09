import { cn } from "@/lib/utils";

const GRADES = [
  { v: "aala", l: "Aala", c: "bg-[var(--color-status-aala)]" },
  { v: "behter", l: "Behter", c: "bg-[var(--color-status-behter)]" },
  { v: "munasib", l: "Munasib", c: "bg-[var(--color-status-munasib)]" },
  { v: "kamzore", l: "Kamzore", c: "bg-[var(--color-status-kamzore)]" },
  { v: "naaga", l: "Naaga", c: "bg-[var(--color-status-naaga)]" },
] as const;

export type Grade = (typeof GRADES)[number]["v"];

export function GradeButtons({
  value,
  onChange,
  size = "sm",
}: {
  value: Grade | null;
  onChange: (g: Grade) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex flex-wrap gap-1">
      {GRADES.map((g) => {
        const active = value === g.v;
        return (
          <button
            key={g.v}
            type="button"
            onClick={() => onChange(g.v)}
            className={cn(
              "rounded-md font-semibold text-white transition-opacity",
              g.c,
              size === "sm" ? "h-7 px-2 text-[11px]" : "h-9 px-3 text-xs",
              active ? "opacity-100 ring-2 ring-foreground/40" : "opacity-50 hover:opacity-90",
            )}
          >
            {g.l}
          </button>
        );
      })}
    </div>
  );
}

const ATT = [
  { v: "present", l: "P", c: "bg-[var(--color-success)]" },
  { v: "absent", l: "A", c: "bg-destructive" },
  { v: "late", l: "L", c: "bg-[var(--color-status-munasib)]" },
] as const;

export type Att = (typeof ATT)[number]["v"];

export function AttendanceButtons({
  value,
  onChange,
}: {
  value: Att;
  onChange: (v: Att) => void;
}) {
  return (
    <div className="inline-flex gap-1">
      {ATT.map((a) => {
        const active = value === a.v;
        return (
          <button
            key={a.v}
            type="button"
            onClick={() => onChange(a.v)}
            className={cn(
              "h-8 w-8 rounded-md text-xs font-bold text-white transition-opacity",
              a.c,
              active ? "opacity-100 ring-2 ring-foreground/40" : "opacity-40 hover:opacity-80",
            )}
            aria-label={a.v}
          >
            {a.l}
          </button>
        );
      })}
    </div>
  );
}
