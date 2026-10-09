import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";

export function StatsCard({
  icon: Icon,
  label,
  value,
  trend,
  iconBg = "bg-primary/10 text-primary",
  alert = false,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: { value: number; positive?: boolean };
  iconBg?: string;
  alert?: boolean;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "p-5 transition-all hover:shadow-md",
        alert && "border-l-4 border-l-warning bg-warning/5",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            iconBg,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              trend.positive
                ? "text-[var(--color-success)]"
                : "text-destructive",
            )}
          >
            {trend.positive ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </Card>
  );
}
