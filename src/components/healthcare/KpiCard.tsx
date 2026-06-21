import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "primary",
  hint,
}: {
  label: string;
  value: string | number;
  delta?: number;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
  hint?: string;
}) {
  const toneBg: Record<string, string> = {
    primary: "gradient-primary",
    success: "gradient-success",
    warning: "gradient-warning",
    danger: "gradient-danger",
    info: "gradient-primary",
  };
  const up = (delta ?? 0) >= 0;
  return (
    <div className="glass-card group relative overflow-hidden rounded-2xl p-5 animate-kpi transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-lg", toneBg[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {delta !== undefined && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
          <span className={cn("inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5",
            up ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
          <span className="text-muted-foreground">vs previous period</span>
        </div>
      )}
    </div>
  );
}