"use client";

import { Plus, Stethoscope, X } from "lucide-react";
import { Suspense, useCallback, useMemo, useState } from "react";
import { DeleteDoctorDialog } from "@/components/doctors/delete-doctor-dialog";
import { DoctorFormDialog } from "@/components/doctors/doctor-form-dialog";
import { DoctorsTable } from "@/components/doctors/doctors-table";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterDropdown } from "@/components/shared/filter-dropdown";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { useUrlParams } from "@/hooks/use-url-params";
import { useDoctorFilterOptions, useDoctors } from "@/hooks/use-doctors";
import type { DoctorListParams } from "@/services/doctors.service";
import type { Doctor } from "@/types";
import { useRouter } from "next/navigation";

function DoctorsView() {
  const router = useRouter();
  const url = useUrlParams();

  const params: DoctorListParams = {
    page: url.getNumber("page", 1),
    limit: url.getNumber("limit", 10),
    search: url.get("search") || undefined,
    specialization: url.get("specialization") || undefined,
    hospital: url.get("hospital") || undefined,
    from: url.get("from") || undefined,
    to: url.get("to") || undefined,
    sortBy: (url.get("sortBy") as DoctorListParams["sortBy"]) || "createdAt",
    order: (url.get("order") as DoctorListParams["order"]) || "desc",
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useDoctors(params);
  const filterOptions = useDoctorFilterOptions();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [deleting, setDeleting] = useState<Doctor | null>(null);

  const hasFilters = !!(params.search || params.specialization || params.hospital || params.from);

  const specOptions = useMemo(() => (filterOptions.data?.specializations ?? []).map((v) => ({ value: v, label: v })), [filterOptions.data]);
  const hospitalOptions = useMemo(() => (filterOptions.data?.hospitals ?? []).map((v) => ({ value: v, label: v })), [filterOptions.data]);

  const onSearch = useCallback((v: string) => url.set({ search: v }), [url]);
  const onSpec = useCallback((v: string) => url.set({ specialization: v }), [url]);
  const onHospital = useCallback((v: string) => url.set({ hospital: v }), [url]);
  const onDates = useCallback((r: { from?: string; to?: string }) => url.set({ from: r.from, to: r.to }), [url]);
  const onPage = useCallback((page: number) => url.set({ page }), [url]);
  const onLimit = useCallback((limit: number) => url.set({ limit }), [url]);
  const onSort = useCallback((s: { sortBy: string; order: "asc" | "desc" }) => url.set({ sortBy: s.sortBy, order: s.order, page: 1 }), [url]);
  const onView = useCallback((d: Doctor) => router.push(`/doctors/${d.id}`), [router]);
  const onEdit = useCallback((d: Doctor) => { setEditing(d); setFormOpen(true); }, []);
  const onDelete = useCallback((d: Doctor) => setDeleting(d), []);

  return (
    <>
      <PageHeader
        title="Doctors"
        description="Manage doctors, their contact details and patient load."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Doctors" }]}
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus /> Add doctor
          </Button>
        }
      />

      <div className="rounded-xl border bg-card shadow-xs">
        <div className="flex flex-col gap-2 border-b p-4 lg:flex-row lg:flex-wrap lg:items-center">
          <SearchInput value={params.search ?? ""} onChange={onSearch} placeholder="Search name, specialization, hospital, email…" className="lg:w-80" />
          <FilterDropdown label="Specializations" value={params.specialization ?? ""} options={specOptions} onChange={onSpec} />
          <FilterDropdown label="Hospitals" value={params.hospital ?? ""} options={hospitalOptions} onChange={onHospital} />
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
            <DoctorsTable
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
                  <EmptyState icon={Stethoscope} title="No doctors match your filters" description="Try a different search term or clear the filters." action={<Button variant="outline" size="sm" onClick={url.reset}>Clear filters</Button>} />
                ) : (
                  <EmptyState icon={Stethoscope} title="No doctors yet" description="Add your first doctor to start tracking patients." action={<Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus /> Add doctor</Button>} />
                )
              }
            />
            {data && data.pagination.total > 0 && (
              <Pagination pagination={data.pagination} onPageChange={onPage} onLimitChange={onLimit} isFetching={isFetching} />
            )}
          </>
        )}
      </div>

      <DoctorFormDialog open={formOpen} onOpenChange={setFormOpen} doctor={editing} />
      <DeleteDoctorDialog doctor={deleting} onOpenChange={(o) => !o && setDeleting(null)} />
    </>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense>
      <DoctorsView />
    </Suspense>
  );
}
