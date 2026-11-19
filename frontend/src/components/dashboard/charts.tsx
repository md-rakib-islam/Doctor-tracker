"use client";

import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { memo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { capitalize } from "@/lib/format";
import type { DashboardStatistics, Interval, PatientsPerDoctorRow } from "@/types";
import { AXIS_PROPS, CHART_COLORS, ChartTooltip, GENDER_COLORS } from "./chart-theme";

const tickLabel = (date: string, interval: Interval) =>
  format(parseISO(date), interval === "month" ? "MMM yy" : "MMM d");

const fullLabel = (date: string, interval: Interval) =>
  interval === "month"
    ? format(parseISO(date), "MMMM yyyy")
    : interval === "week"
      ? `Week of ${format(parseISO(date), "MMM d, yyyy")}`
      : format(parseISO(date), "EEE, MMM d, yyyy");

interface RegistrationsProps {
  series: DashboardStatistics["series"];
  interval: Interval;
  metric: "patients" | "doctors";
}

/** Registrations over time. Patients = area (volume), doctors = bars (sparse, discrete events). */
export const RegistrationsChart = memo(function RegistrationsChart({ series, interval, metric }: RegistrationsProps) {
  const color = metric === "patients" ? CHART_COLORS.teal : CHART_COLORS.indigo;
  const name = metric === "patients" ? "Patients" : "Doctors";
  const common = {
    data: series,
    margin: { top: 8, right: 8, left: -16, bottom: 0 },
  };
  const axes = (
    <>
      <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
      <XAxis dataKey="date" {...AXIS_PROPS} tickFormatter={(d) => tickLabel(d, interval)} minTickGap={24} tickMargin={8} />
      <YAxis {...AXIS_PROPS} allowDecimals={false} width={44} />
      <Tooltip
        cursor={{ stroke: CHART_COLORS.grid }}
        content={({ active, payload }) =>
          active && payload?.length ? (
            <ChartTooltip
              title={fullLabel(payload[0].payload.date, interval)}
              rows={[{ label: `New ${name.toLowerCase()}`, value: payload[0].value as number, color }]}
            />
          ) : null
        }
      />
    </>
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      {metric === "patients" ? (
        <AreaChart {...common}>
          <defs>
            <linearGradient id="fillPatients" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {axes}
          <Area type="monotone" dataKey="patients" stroke={color} strokeWidth={2} fill="url(#fillPatients)" activeDot={{ r: 4 }} />
        </AreaChart>
      ) : (
        <BarChart {...common}>
          {axes}
          <Bar dataKey="doctors" fill={color} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
});

export const PatientsPerDoctorChart = memo(function PatientsPerDoctorChart({ rows }: { rows: PatientsPerDoctorRow[] }) {
  const router = useRouter();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }} barCategoryGap={8}>
        <CartesianGrid horizontal={false} stroke={CHART_COLORS.grid} />
        <XAxis type="number" {...AXIS_PROPS} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={132}
          {...AXIS_PROPS}
          tickFormatter={(v: string) => (v.length > 20 ? `${v.slice(0, 19)}…` : v)}
        />
        <Tooltip
          cursor={{ fill: "oklch(0.96 0.01 215)" }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <ChartTooltip
                title={payload[0].payload.name}
                rows={[
                  { label: "Specialization", value: payload[0].payload.specialization },
                  { label: "Patients", value: payload[0].value as number, color: CHART_COLORS.teal },
                ]}
              />
            ) : null
          }
        />
        <Bar
          dataKey="patientCount"
          fill={CHART_COLORS.teal}
          radius={[0, 4, 4, 0]}
          maxBarSize={22}
          cursor="pointer"
          onClick={(d) => router.push(`/doctors/${(d as unknown as PatientsPerDoctorRow).doctorId}`)}
        />
      </BarChart>
    </ResponsiveContainer>
  );
});

export const ConditionsChart = memo(function ConditionsChart({ rows }: { rows: DashboardStatistics["conditions"] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }} barCategoryGap={6}>
        <CartesianGrid horizontal={false} stroke={CHART_COLORS.grid} />
        <XAxis type="number" {...AXIS_PROPS} allowDecimals={false} />
        <YAxis type="category" dataKey="condition" width={108} {...AXIS_PROPS} />
        <Tooltip
          cursor={{ fill: "oklch(0.96 0.01 215)" }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <ChartTooltip title={payload[0].payload.condition} rows={[{ label: "Patients", value: payload[0].value as number, color: CHART_COLORS.violet }]} />
            ) : null
          }
        />
        <Bar dataKey="count" fill={CHART_COLORS.violet} radius={[0, 4, 4, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
});

export const GenderChart = memo(function GenderChart({ rows }: { rows: DashboardStatistics["gender"] }) {
  const data = rows.map((r) => ({ name: capitalize(r.gender), value: r.count, key: r.gender }));
  const total = data.reduce((s, r) => s + r.value, 0);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="82%" paddingAngle={2} stroke="none">
          {data.map((d) => (
            <Cell key={d.key} fill={GENDER_COLORS[d.key] ?? CHART_COLORS.axis} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) =>
            active && payload?.length ? (
              <ChartTooltip
                title={String(payload[0].name)}
                rows={[
                  { label: "Patients", value: payload[0].value as number, color: GENDER_COLORS[String(payload[0].name).toLowerCase()] },
                  { label: "Share", value: `${Math.round(((payload[0].value as number) / total) * 100)}%` },
                ]}
              />
            ) : null
          }
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
});
