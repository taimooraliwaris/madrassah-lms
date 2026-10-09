import { cn } from "@/lib/utils";

export type PerfStatus = "aala" | "behter" | "munasib" | "kamzore" | "naaga";
export type EntryStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected";

const PERF_STYLES: Record<PerfStatus, { bg: string; label: string }> = {
  aala: { bg: "bg-[var(--color-status-aala)]", label: "Aala" },
  behter: { bg: "bg-[var(--color-status-behter)]", label: "Behter" },
  munasib: { bg: "bg-[var(--color-status-munasib)]", label: "Munasib" },
  kamzore: { bg: "bg-[var(--color-status-kamzore)]", label: "Kamzore" },
  naaga: { bg: "bg-[var(--color-status-naaga)]", label: "Naaga" },
};

const ENTRY_STYLES: Record<
  EntryStatus,
  { bg: string; text: string; label: string }
> = {
  draft: { bg: "bg-muted", text: "text-muted-foreground", label: "Draft" },
  pending: {
    bg: "bg-warning/15",
    text: "text-warning-foreground border border-warning/40",
    label: "Pending Approval",
  },
  approved: {
    bg: "bg-success/15",
    text: "text-[var(--color-success)] border border-success/40",
    label: "Approved",
  },
  rejected: {
    bg: "bg-destructive/15",
    text: "text-destructive border border-destructive/40",
    label: "Rejected",
  },
};

export function PerformanceBadge({
  status,
  size = "md",
  className,
}: {
  status: PerfStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sz =
    size === "sm"
      ? "h-[18px] px-2 text-[11px]"
      : size === "lg"
        ? "h-7 px-3 text-sm"
        : "h-[22px] px-2.5 text-xs";
  const cfg = PERF_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white",
        cfg.bg,
        sz,
        className,
      )}
    >
      {cfg.label}
    </span>
  );
}

export function EntryStatusBadge({
  status,
  className,
}: {
  status: EntryStatus;
  className?: string;
}) {
  const cfg = ENTRY_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        cfg.bg,
        cfg.text,
        className,
      )}
    >
      {status === "pending" && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warning" />
      )}
      {cfg.label}
    </span>
  );
}
