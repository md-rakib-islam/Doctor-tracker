import { api } from "@/lib/api-client";
import type { Doctor, DoctorFilterOptions, DoctorSummary, Paginated, Patient } from "@/types";
import type { DoctorFormValues } from "@/schemas/doctor";
import type { PatientFormValues } from "@/schemas/patient";

export interface DoctorListParams {
  page?: number;
  limit?: number;
  search?: string;
  specialization?: string;
  hospital?: string;
  from?: string;
  to?: string;
  sortBy?: "createdAt" | "name";
  order?: "asc" | "desc";
}

export interface DoctorPatientsParams {
  page?: number;
  limit?: number;
  search?: string;
  condition?: string;
}

export interface DeleteDoctorOptions {
  cascade?: boolean;
  reassignTo?: string;
}

export const doctorsService = {
  list: async (params: DoctorListParams, signal?: AbortSignal): Promise<Paginated<Doctor>> => {
    const res = await api.get<Doctor[]>("/doctors", { ...params }, signal);
    return { items: res.data, pagination: res.pagination! };
  },
  get: async (id: string) => (await api.get<Doctor>(`/doctors/${id}`)).data,
  create: async (values: DoctorFormValues) => (await api.post<Doctor>("/doctors", values)).data,
  update: async (id: string, values: Partial<DoctorFormValues>) => (await api.patch<Doctor>(`/doctors/${id}`, values)).data,
  remove: async (id: string, opts: DeleteDoctorOptions = {}) =>
    (await api.delete<{ reassigned: number; removedPatients: number }>(`/doctors/${id}`, {
      cascade: opts.cascade ? "true" : undefined,
      reassignTo: opts.reassignTo,
    })).data,
  patients: async (id: string, params: DoctorPatientsParams, signal?: AbortSignal): Promise<Paginated<Patient>> => {
    const res = await api.get<Patient[]>(`/doctors/${id}/patients`, { ...params }, signal);
    return { items: res.data, pagination: res.pagination! };
  },
  // The doctor comes from the URL; the API ignores any doctorId in the body.
  addPatient: async (id: string, values: PatientFormValues) =>
    (await api.post<Patient>(`/doctors/${id}/patients`, values)).data,
  filters: async () => (await api.get<DoctorFilterOptions>("/doctors/filters")).data,
  options: async () => (await api.get<DoctorSummary[]>("/doctors/options")).data,
};
