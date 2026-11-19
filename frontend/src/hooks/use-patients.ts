import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { patientsService, type PatientListParams } from "@/services/patients.service";
import type { PatientFormValues } from "@/schemas/patient";

export const usePatients = (params: PatientListParams) =>
  useQuery({
    queryKey: queryKeys.patients.list(params),
    queryFn: ({ signal }) => patientsService.list(params, signal),
    placeholderData: keepPreviousData,
  });

function useInvalidateAll() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.patients.all }),
      qc.invalidateQueries({ queryKey: queryKeys.doctors.all }), // patient counts
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    ]);
}

export function useCreatePatient() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (v: PatientFormValues) => patientsService.create(v),
    onSuccess: async (p) => {
      await invalidate();
      toast.success(`${p.fullName} was added`);
    },
  });
}

export function useUpdatePatient() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<PatientFormValues> }) => patientsService.update(id, values),
    onSuccess: async (p) => {
      await invalidate();
      toast.success(`${p.fullName} was updated`);
    },
  });
}

export function useDeletePatient() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (id: string) => patientsService.remove(id),
    onSuccess: async () => {
      await invalidate();
      toast.success("Patient deleted");
    },
    onError: (e) => toast.error(e.message),
  });
}
