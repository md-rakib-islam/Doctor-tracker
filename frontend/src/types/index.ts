export type Gender = "male" | "female" | "other";

export interface Admin {
  id: string;
  name: string;
  email: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  patientCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorSummary {
  id: string;
  name: string;
  specialization: string;
  hospital?: string;
}

export interface Patient {
  id: string;
  fullName: string;
  age: number;
  gender: Gender;
  phone: string;
  email?: string;
  condition: string;
  doctorId: string;
  doctor: DoctorSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface DoctorFilterOptions {
  specializations: string[];
  hospitals: string[];
}

export interface TrendValue {
  current: number;
  previous: number;
  changePercent: number | null;
}

export interface DashboardOverview {
  totalDoctors: number;
  totalPatients: number;
  averagePatientsPerDoctor: number;
  doctorsWithoutPatients: number;
  periodDays: number;
  newDoctors: TrendValue;
  newPatients: TrendValue;
}

export interface PatientsPerDoctorRow {
  doctorId: string;
  name: string;
  specialization: string;
  patientCount: number;
}

export type Interval = "day" | "week" | "month";

export interface DashboardStatistics {
  range: { from: string; to: string; interval: Interval };
  totals: { doctors: number; patients: number };
  series: { date: string; doctors: number; patients: number }[];
  conditions: { condition: string; count: number }[];
  gender: { gender: Gender; count: number }[];
}
