"use client";

import { format, subDays } from "date-fns";
import { Activity, Stethoscope, UserPlus, Users } from "lucide-react";
import { Suspense, useCallback, useMemo } from "react";
import { ConditionsChart, GenderChart, PatientsPerDoctorChart, RegistrationsChart } from "@/components/dashboard/charts";
import { ChartCard } from "@/components/shared/chart-card";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { FilterDropdown } from "@/components/shared/filter-dropdown";
import { PageHeader } from "@/components/shared/page-header";
import { StatisticsCard } from "@/components/shared/statistics-card";
import { useOverview, usePatientsPerDoctor, useStatistics } from "@/hooks/use-dashboard";
import { useUrlParams } from "@/hooks/use-url-params";
import { formatDate } from "@/lib/format";
import type { Interval } from "@/types";

const INTERVAL_OPTIONS = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
];

const OVERVIEW_DAYS = 30;

function DashboardView() {
  const url = useUrlParams();

  // Default window: the last 30 days (computed once per mount so query keys stay stable).
  const defaults = useMemo(() => ({ from: format(subDays(new Date(), 29), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }), []);
  const from = url.get("from") || defaults.from;
  const to = url.get("to") || (url.get("from") ? undefined : defaults.to);
  const interval = (url.get("interval") as Interval) || undefined;

  const overview = useOverview(OVERVIEW_DAYS);
  const stats = useStatistics({ from, to, interval });
  const perDoctor = usePatientsPerDoctor({ from, to, limit: 10 });

  const onDates = useCallback((r: { from?: string; to?: string }) => url.set({ from: r.from, to: r.to }), [url]);
  const onInterval = useCallback((v: string) => url.set({ interval: v }), [url]);

  const o = overview.data;
  const effectiveInterval = stats.data?.range.interval ?? "day";
  const rangeLabel = stats.data ? `${formatDate(stats.data.range.from)} – ${formatDate(stats.data.range.to)}` : "";

  const controls = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <DateRangePicker value={{ from, to }} onChange={onDates} placeholder="Date range" clearable={false} />
      <FilterDropdown label="Interval" allLabel="Auto interval" value={interval ?? ""} options={INTERVAL_OPTIONS} onChange={onInterval} className="sm:min-w-36" />
    </div>
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live overview of doctors, patients and registration activity."
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={controls}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatisticsCard
          label="Total doctors"
          icon={Stethoscope}
          value={o?.totalDoctors}
          isLoading={overview.isLoading}
          hint={o ? `${o.doctorsWithoutPatients} without patients` : undefined}
        />
        <StatisticsCard label="Total patients" icon={Users} value={o?.totalPatients} isLoading={overview.isLoading} hint="Across all doctors" />
        <StatisticsCard
          label="Avg. patients per doctor"
          icon={Activity}
          value={o?.averagePatientsPerDoctor}
          isLoading={overview.isLoading}
          hint="Total patients ÷ total doctors"
        />
        <StatisticsCard
          label={`New patients · ${OVERVIEW_DAYS} days`}
          icon={UserPlus}
          value={o?.newPatients.current}
          isLoading={overview.isLoading}
          trend={o?.newPatients.changePercent}
          trendLabel={`vs previous ${OVERVIEW_DAYS} days`}
          hint={o ? `${o.newPatients.previous} in the previous ${OVERVIEW_DAYS} days` : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-3"
          title="Patients per doctor"
          description={`Top 10 doctors by patients registered · ${rangeLabel}`}
          isLoading={perDoctor.isLoading}
          isError={perDoctor.isError}
          onRetry={() => perDoctor.refetch()}
          isEmpty={perDoctor.data?.length === 0}
          emptyDescription="No patients were registered in this period."
          height={Math.max(220, (perDoctor.data?.length ?? 6) * 34 + 24)}
        >
          <PatientsPerDoctorChart rows={perDoctor.data ?? []} />
        </ChartCard>

        <ChartCard
          className="lg:col-span-3 xl:col-span-2"
          title="Patient registrations"
          description={stats.data ? `${stats.data.totals.patients.toLocaleString()} new ${stats.data.totals.patients === 1 ? "patient" : "patients"} · ${rangeLabel}` : "New patients over time"}
          isLoading={stats.isLoading}
          isError={stats.isError}
          onRetry={() => stats.refetch()}
          isEmpty={stats.data?.totals.patients === 0}
          emptyDescription="No patients were registered in this period."
        >
          <RegistrationsChart series={stats.data?.series ?? []} interval={effectiveInterval} metric="patients" />
        </ChartCard>

        <ChartCard
          className="lg:col-span-3 xl:col-span-1"
          title="Patients by gender"
          description="Share of patients registered in the period"
          isLoading={stats.isLoading}
          isError={stats.isError}
          onRetry={() => stats.refetch()}
          isEmpty={stats.data?.gender.length === 0}
        >
          <GenderChart rows={stats.data?.gender ?? []} />
        </ChartCard>

        <ChartCard
          className="lg:col-span-3 xl:col-span-2"
          title="Doctor registrations"
          description={stats.data ? `${stats.data.totals.doctors.toLocaleString()} new ${stats.data.totals.doctors === 1 ? "doctor" : "doctors"} · ${rangeLabel}` : "New doctors over time"}
          isLoading={stats.isLoading}
          isError={stats.isError}
          onRetry={() => stats.refetch()}
          isEmpty={stats.data?.totals.doctors === 0}
          emptyDescription="No doctors were registered in this period."
        >
          <RegistrationsChart series={stats.data?.series ?? []} interval={effectiveInterval} metric="doctors" />
        </ChartCard>

        <ChartCard
          className="lg:col-span-3 xl:col-span-1"
          title="Patients by condition"
          description="Most common conditions in the period"
          isLoading={stats.isLoading}
          isError={stats.isError}
          onRetry={() => stats.refetch()}
          isEmpty={stats.data?.conditions.length === 0}
          height={Math.max(280, (stats.data?.conditions.length ?? 8) * 28 + 24)}
        >
          <ConditionsChart rows={stats.data?.conditions ?? []} />
        </ChartCard>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardView />
    </Suspense>
  );
}
