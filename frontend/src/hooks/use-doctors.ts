import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import {
  doctorsService,
  type DeleteDoctorOptions,
  type DoctorListParams,
  type DoctorPatientsParams,
} from "@/services/doctors.service";
import type { DoctorFormValues } from "@/schemas/doctor";
import type { PatientFormValues } from "@/schemas/patient";

export const useDoctors = (params: DoctorListParams) =>
  useQuery({
    queryKey: queryKeys.doctors.list(params),
    queryFn: ({ signal }) => doctorsService.list(params, signal),
    placeholderData: keepPreviousData, // keep the old page visible while the next one loads
  });

export const useDoctor = (id: string) =>
  useQuery({ queryKey: queryKeys.doctors.detail(id), queryFn: () => doctorsService.get(id) });

export const useDoctorPatients = (id: string, params: DoctorPatientsParams) =>
  useQuery({
    queryKey: queryKeys.doctors.patients(id, params),
    queryFn: ({ signal }) => doctorsService.patients(id, params, signal),
    placeholderData: keepPreviousData,
  });

export const useDoctorFilterOptions = () =>
  useQuery({ queryKey: queryKeys.doctors.filters, queryFn: doctorsService.filters, staleTime: 5 * 60_000 });

export const useDoctorOptions = () =>
  useQuery({ queryKey: queryKeys.doctors.options, queryFn: doctorsService.options, staleTime: 5 * 60_000 });

/** Doctor mutations change counts everywhere (patients, dashboard), so invalidate all three domains. */
function useInvalidateAll() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.doctors.all }),
      qc.invalidateQueries({ queryKey: queryKeys.patients.all }),
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    ]);
}

export function useCreateDoctor() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (v: DoctorFormValues) => doctorsService.create(v),
    onSuccess: async (d) => {
      await invalidate();
      toast.success(`${d.name} was added`);
    },
  });
}

export function useUpdateDoctor() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<DoctorFormValues> }) => doctorsService.update(id, values),
    onSuccess: async (d) => {
      await invalidate();
      toast.success(`${d.name} was updated`);
    },
  });
}

export function useDeleteDoctor() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, ...opts }: { id: string } & DeleteDoctorOptions) => doctorsService.remove(id, opts),
    onSuccess: async (r) => {
      await invalidate();
      toast.success(
        r.removedPatients
          ? `Doctor and ${r.removedPatients} patient${r.removedPatients === 1 ? "" : "s"} deleted`
          : r.reassigned
            ? `Doctor deleted · ${r.reassigned} patient${r.reassigned === 1 ? "" : "s"} reassigned`
            : "Doctor deleted",
      );
    },
    onError: (e) => {
      // 409 is handled inline in the delete dialog (it offers reassign/cascade) - don't double-toast.
      if (!(e instanceof ApiError && e.status === 409)) toast.error(e.message);
    },
  });
}

export function useAddDoctorPatient(doctorId: string) {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (v: PatientFormValues) => doctorsService.addPatient(doctorId, v),
    onSuccess: async (p) => {
      await invalidate();
      toast.success(`${p.fullName} was added`);
    },
  });
}
