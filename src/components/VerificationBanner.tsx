import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "info" | "pending" | "approved" | "rejected";

const CFG: Record<
  Variant,
  { icon: typeof ShieldCheck; bg: string; border: string }
> = {
  info: {
    icon: ShieldCheck,
    bg: "bg-warning/10 text-warning-foreground",
    border: "border-warning/40",
  },
  pending: {
    icon: Clock,
    bg: "bg-warning/15 text-warning-foreground",
    border: "border-l-4 border-warning",
  },
  approved: {
    icon: CheckCircle2,
    bg: "bg-success/10 text-[var(--color-success)]",
    border: "border-success/40",
  },
  rejected: {
    icon: XCircle,
    bg: "bg-destructive/10 text-destructive",
    border: "border-l-4 border-destructive",
  },
};

export function VerificationBanner({
  variant = "info",
  title,
  description,
  action,
}: {
  variant?: Variant;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const { icon: Icon, bg, border } = CFG[variant];
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3",
        bg,
        border,
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        {description && (
          <div className="mt-0.5 text-xs opacity-80">{description}</div>
        )}
      </div>
      {action}
    </div>
  );
}
