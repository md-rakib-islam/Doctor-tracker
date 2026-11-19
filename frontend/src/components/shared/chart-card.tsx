import { BarChart3 } from "lucide-react";
import { ChartSkeleton } from "./loading-skeleton";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";

interface ChartCardProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  height?: number;
  className?: string;
  children: React.ReactNode;
}

export function ChartCard({
  title,
  description,
  actions,
  isLoading,
  isError,
  onRetry,
  isEmpty,
  emptyTitle = "No data for this period",
  emptyDescription = "Try a wider date range.",
  height = 280,
  className,
  children,
}: ChartCardProps) {
  return (
    <section className={`rounded-xl border bg-card shadow-xs ${className ?? ""}`}>
      <header className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
      <div className="p-5">
        {isLoading ? (
          <ChartSkeleton height={height} />
        ) : isError ? (
          <ErrorState title="Couldn't load chart" onRetry={onRetry} className="py-8" />
        ) : isEmpty ? (
          <EmptyState icon={BarChart3} title={emptyTitle} description={emptyDescription} className="py-8" />
        ) : (
          <div style={{ height }}>{children}</div>
        )}
      </div>
    </section>
  );
}
