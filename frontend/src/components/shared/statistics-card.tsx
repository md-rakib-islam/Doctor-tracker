import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatisticsCardProps {
  label: string;
  value?: string | number;
  icon: LucideIcon;
  hint?: string;
  /** Percent change vs previous period. `null`/undefined = no baseline, so no trend is shown (never faked). */
  trend?: number | null;
  trendLabel?: string;
  isLoading?: boolean;
}

export function StatisticsCard({ label, value, icon: Icon, hint, trend, trendLabel, isLoading }: StatisticsCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4" />
        </span>
      </div>
      {isLoading ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      ) : (
        <>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            {trend != null && (
              <span
                className={`inline-flex items-center gap-0.5 font-medium ${trend >= 0 ? "text-emerald-600" : "text-rose-600"}`}
              >
                {trend >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {trend > 0 ? "+" : ""}
                {trend}%
              </span>
            )}
            <span>{trend != null && trendLabel ? trendLabel : hint}</span>
          </div>
        </>
      )}
    </div>
  );
}
