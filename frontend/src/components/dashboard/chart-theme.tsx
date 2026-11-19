// Concrete colours (not CSS vars) so Recharts SVG output is identical in every browser.
// Hues are spread for colour-blind safety and match the --chart-* tokens in globals.css.
export const CHART_COLORS = {
  teal: "oklch(0.55 0.1 195)",
  indigo: "oklch(0.6 0.15 265)",
  amber: "oklch(0.75 0.14 75)",
  rose: "oklch(0.65 0.17 15)",
  violet: "oklch(0.6 0.14 310)",
  grid: "oklch(0.92 0.008 225)",
  axis: "oklch(0.5 0.02 245)",
};

export const GENDER_COLORS: Record<string, string> = {
  female: CHART_COLORS.rose,
  male: CHART_COLORS.indigo,
  other: CHART_COLORS.amber,
};

export const AXIS_PROPS = {
  tick: { fontSize: 12, fill: CHART_COLORS.axis },
  tickLine: false,
  axisLine: false,
} as const;

export function ChartTooltip({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string | number; color?: string }[];
}) {
  return (
    <div className="min-w-36 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-popover-foreground">{title}</p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {r.color && <span className="size-2 rounded-full" style={{ background: r.color }} />}
              {r.label}
            </span>
            <span className="font-medium tabular-nums">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
