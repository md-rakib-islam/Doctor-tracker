"use client";

import { Plus, Users, X } from "lucide-react";
import { Suspense, useCallback, useMemo, useState } from "react";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterDropdown } from "@/components/shared/filter-dropdown";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PatientDetailsDialog } from "@/components/patients/patient-details-dialog";
import { PatientFormDialog } from "@/components/patients/patient-form-dialog";
import { PatientsTable } from "@/components/patients/patients-table";
import { Button } from "@/components/ui/button";
import { GENDERS, PATIENT_CONDITIONS } from "@/constants";
import { useDoctorOptions } from "@/hooks/use-doctors";
import { useDeletePatient, usePatients } from "@/hooks/use-patients";
import { useUrlParams } from "@/hooks/use-url-params";
import type { PatientListParams } from "@/services/patients.service";
import type { Patient } from "@/types";

const CONDITION_OPTIONS = PATIENT_CONDITIONS.map((c) => ({ value: c, label: c }));
const GENDER_OPTIONS = GENDERS.map((g) => ({ value: g.value, label: g.label }));

function PatientsView() {
  const url = useUrlParams();

  const params: PatientListParams = {
    page: url.getNumber("page", 1),
    limit: url.getNumber("limit", 10),
    search: url.get("search") || undefined,
    condition: url.get("condition") || undefined,
    gender: url.get("gender") || undefined,
    doctorId: url.get("doctorId") || undefined,
    from: url.get("from") || undefined,
    to: url.get("to") || undefined,
    sortBy: (url.get("sortBy") as PatientListParams["sortBy"]) || "createdAt",
    order: (url.get("order") as PatientListParams["order"]) || "desc",
  };

  const { data, isLoading, isFetching, isError, error, refetch } = usePatients(params);
  const doctors = useDoctorOptions();
  const del = useDeletePatient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [viewing, setViewing] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState<Patient | null>(null);

  const hasFilters = !!(params.search || params.condition || params.gender || params.doctorId || params.from);
  const doctorOptions = useMemo(() => (doctors.data ?? []).map((d) => ({ value: d.id, label: d.name })), [doctors.data]);

  const onSearch = useCallback((v: string) => url.set({ search: v }), [url]);
  const onCondition = useCallback((v: string) => url.set({ condition: v }), [url]);
  const onGender = useCallback((v: string) => url.set({ gender: v }), [url]);
  const onDoctor = useCallback((v: string) => url.set({ doctorId: v }), [url]);
  const onDates = useCallback((r: { from?: string; to?: string }) => url.set({ from: r.from, to: r.to }), [url]);
  const onPage = useCallback((page: number) => url.set({ page }), [url]);
  const onLimit = useCallback((limit: number) => url.set({ limit }), [url]);
  const onSort = useCallback((s: { sortBy: string; order: "asc" | "desc" }) => url.set({ sortBy: s.sortBy, order: s.order, page: 1 }), [url]);
  const onView = useCallback((p: Patient) => setViewing(p), []);
  const onEdit = useCallback((p: Patient) => { setEditing(p); setFormOpen(true); }, []);
  const onDelete = useCallback((p: Patient) => setDeleting(p), []);

  const openCreate = () => { setEditing(null); setFormOpen(true); };

  return (
    <>
      <PageHeader
        title="Patients"
        description="All registered patients across every doctor."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Patients" }]}
        actions={<Button onClick={openCreate}><Plus /> Add patient</Button>}
      />

      <div className="rounded-xl border bg-card shadow-xs">
        <div className="flex flex-col gap-2 border-b p-4 lg:flex-row lg:flex-wrap lg:items-center">
          <SearchInput value={params.search ?? ""} onChange={onSearch} placeholder="Search name, phone, email, doctor…" className="lg:w-80" />
          <FilterDropdown label="Conditions" value={params.condition ?? ""} options={CONDITION_OPTIONS} onChange={onCondition} />
          <FilterDropdown label="Doctors" value={params.doctorId ?? ""} options={doctorOptions} onChange={onDoctor} />
          <FilterDropdown label="Genders" value={params.gender ?? ""} options={GENDER_OPTIONS} onChange={onGender} className="sm:min-w-32" />
          <DateRangePicker value={{ from: params.from, to: params.to }} onChange={onDates} />
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={url.reset}>
              <X /> Clear filters
            </Button>
          )}
        </div>

        {isError ? (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : (
          <>
            <PatientsTable
              rows={data?.items}
              isLoading={isLoading}
              isFetching={isFetching && !isLoading}
              sort={{ sortBy: params.sortBy!, order: params.order! }}
              onSortChange={onSort}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              empty={
                hasFilters ? (
                  <EmptyState icon={Users} title="No patients match your filters" description="Try a different search term or clear the filters." action={<Button variant="outline" size="sm" onClick={url.reset}>Clear filters</Button>} />
                ) : (
                  <EmptyState icon={Users} title="No patients yet" description="Add a patient and assign them to a doctor." action={<Button size="sm" onClick={openCreate}><Plus /> Add patient</Button>} />
                )
              }
            />
            {data && data.pagination.total > 0 && (
              <Pagination pagination={data.pagination} onPageChange={onPage} onLimitChange={onLimit} isFetching={isFetching} />
            )}
          </>
        )}
      </div>

      <PatientFormDialog open={formOpen} onOpenChange={setFormOpen} patient={editing} />
      <PatientDetailsDialog patient={viewing} onOpenChange={(o) => !o && setViewing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.fullName ?? "patient"}?`}
        description="This permanently removes the patient record. This action cannot be undone."
        confirmLabel="Delete patient"
        destructive
        loading={del.isPending}
        onConfirm={() => deleting && del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}

export default function PatientsPage() {
  return (
    <Suspense>
      <PatientsView />
    </Suspense>
  );
}
