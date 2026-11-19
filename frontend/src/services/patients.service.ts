import { api } from "@/lib/api-client";
import type { Paginated, Patient } from "@/types";
import type { PatientFormValues } from "@/schemas/patient";

export interface PatientListParams {
  page?: number;
  limit?: number;
  search?: string;
  condition?: string;
  gender?: string;
  doctorId?: string;
  from?: string;
  to?: string;
  sortBy?: "createdAt" | "fullName" | "age";
  order?: "asc" | "desc";
}

export const patientsService = {
  list: async (params: PatientListParams, signal?: AbortSignal): Promise<Paginated<Patient>> => {
    const res = await api.get<Patient[]>("/patients", { ...params }, signal);
    return { items: res.data, pagination: res.pagination! };
  },
  get: async (id: string) => (await api.get<Patient>(`/patients/${id}`)).data,
  create: async (values: PatientFormValues) => (await api.post<Patient>("/patients", values)).data,
  update: async (id: string, values: Partial<PatientFormValues>) => (await api.patch<Patient>(`/patients/${id}`, values)).data,
  remove: async (id: string) => {
    await api.delete(`/patients/${id}`);
  },
};
