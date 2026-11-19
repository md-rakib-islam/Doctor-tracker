import { api } from "@/lib/api-client";
import type { DashboardOverview, DashboardStatistics, Interval, PatientsPerDoctorRow } from "@/types";

export interface RangeParams {
  from?: string;
  to?: string;
}

export const dashboardService = {
  overview: async (days: number, signal?: AbortSignal) =>
    (await api.get<DashboardOverview>("/dashboard/overview", { days }, signal)).data,
  patientsPerDoctor: async (params: RangeParams & { limit?: number }, signal?: AbortSignal) =>
    (await api.get<PatientsPerDoctorRow[]>("/dashboard/patients-per-doctor", { ...params }, signal)).data,
  statistics: async (params: RangeParams & { interval?: Interval }, signal?: AbortSignal) =>
    (await api.get<DashboardStatistics>("/dashboard/statistics", { ...params }, signal)).data,
};
