import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { dashboardService, type RangeParams } from "@/services/dashboard.service";
import type { Interval } from "@/types";

export const useOverview = (days: number) =>
  useQuery({ queryKey: queryKeys.dashboard.overview(days), queryFn: ({ signal }) => dashboardService.overview(days, signal) });

export const usePatientsPerDoctor = (params: RangeParams & { limit?: number }) =>
  useQuery({
    queryKey: queryKeys.dashboard.perDoctor(params),
    queryFn: ({ signal }) => dashboardService.patientsPerDoctor(params, signal),
    placeholderData: keepPreviousData,
  });

export const useStatistics = (params: RangeParams & { interval?: Interval }) =>
  useQuery({
    queryKey: queryKeys.dashboard.statistics(params),
    queryFn: ({ signal }) => dashboardService.statistics(params, signal),
    placeholderData: keepPreviousData,
  });
