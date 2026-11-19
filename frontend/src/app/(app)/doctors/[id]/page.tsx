"use client";

import { Building2, CalendarDays, Mail, Pencil, Phone, Plus, Stethoscope, Trash2, Users, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DeleteDoctorDialog } from "@/components/doctors/delete-doctor-dialog";
import { DoctorAvatar } from "@/components/doctors/doctor-avatar";
import { DoctorFormDialog } from "@/components/doctors/doctor-form-dialog";
import { PatientDetailsDialog } from "@/components/patients/patient-details-dialog";
import { PatientFormDialog } from "@/components/patients/patient-form-dialog";
import { PatientsTable } from "@/components/patients/patients-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterDropdown } from "@/components/shared/filter-dropdown";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PATIENT_CONDITIONS } from "@/constants";
import { useDoctor, useDoctorPatients } from "@/hooks/use-doctors";
import { useDeletePatient } from "@/hooks/use-patients";
import { useUrlParams } from "@/hooks/use-url-params";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import type { Patient } from "@/types";

const CONDITION_OPTIONS = PATIENT_CONDITIONS.map((c) => ({ value: c, label: c }));

function InfoItem({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{children}</p>
      </div>
    </div>
  );
}

function DoctorDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const url = useUrlParams();
  const doctor = useDoctor(id);

  const params = {
    page: url.getNumber("page", 1),
    limit: url.getNumber("limit", 10),
    search: url.get("search") || undefined,
    condition: url.get("condition") || undefined,
  };
  const patients = useDoctorPatients(id, params);
  const del = useDeletePatient();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteDoctorOpen, setDeleteDoctorOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewing, setViewing] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState<Patient | null>(null);

  const onSearch = useCallback((v: string) => url.set({ search: v }), [url]);
  const onCondition = useCallback((v: string) => url.set({ condition: v }), [url]);
  const onPage = useCallback((page: number) => url.set({ page }), [url]);
  const onLimit = useCallback((limit: number) => url.set({ limit }), [url]);
  const onView = useCallback((p: Patient) => setViewing(p), []);
  const onEdit = useCallback((p: Patient) => setEditingPatient(p), []);
  const onDelete = useCallback((p: Patient) => setDeleting(p), []);

  if (doctor.isError) {
    const notFound = doctor.error instanceof ApiError && (doctor.error.status === 404 || doctor.error.status === 400);
    return (
      <>
        <PageHeader title="Doctor" breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Doctors", href: "/doctors" }, { label: "Details" }]} />
        <div className="rounded-xl border bg-card">
          {notFound ? (
            <EmptyState icon={Stethoscope} title="Doctor not found" description="This doctor may have been deleted." action={<Button variant="outline" size="sm" onClick={() => router.push("/doctors")}>Back to doctors</Button>} />
          ) : (
            <ErrorState message={doctor.error.message} onRetry={() => doctor.refetch()} />
          )}
        </div>
      </>
    );
  }

  const d = doctor.data;
  const hasFilters = !!(params.search || params.condition);

  return (
    <>
      <PageHeader
        title={d?.name ?? "Doctor"}
        description={d ? `${d.specialization} · ${d.hospital}` : undefined}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Doctors", href: "/doctors" }, { label: d?.name ?? "Details" }]}
        actions={
          d && (
            <>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil /> Edit
              </Button>
              <Button variant="destructive" onClick={() => setDeleteDoctorOpen(true)}>
                <Trash2 /> Delete
              </Button>
            </>
          )
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border bg-card p-5 shadow-xs lg:col-span-2">
          <div className="mb-5 flex items-center gap-4">
            {d ? <DoctorAvatar name={d.name} size="lg" /> : <Skeleton className="size-14 rounded-full" />}
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{d?.name ?? <Skeleton className="h-5 w-48" />}</h2>
              <p className="text-sm text-muted-foreground">{d?.specialization}</p>
            </div>
          </div>
          {d ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem icon={Building2} label="Hospital">{d.hospital}</InfoItem>
              <InfoItem icon={Phone} label="Phone">{d.phone}</InfoItem>
              <InfoItem icon={Mail} label="Email">{d.email}</InfoItem>
              <InfoItem icon={CalendarDays} label="Registered">{formatDate(d.createdAt)}</InfoItem>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          )}
        </section>

        <section className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total patients</p>
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Users className="size-4" />
            </span>
          </div>
          <div>
            {d ? <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums">{d.patientCount}</p> : <Skeleton className="mt-3 h-10 w-16" />}
            <p className="mt-1 text-xs text-muted-foreground">{d ? `Last updated ${formatDate(d.updatedAt)}` : ""}</p>
          </div>
        </section>
      </div>

      <section className="rounded-xl border bg-card shadow-xs">
        <header className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Patients</h2>
            <p className="text-xs text-muted-foreground">Patients assigned to this doctor</p>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)} disabled={!d}>
            <Plus /> Add patient
          </Button>
        </header>
        <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center">
          <SearchInput value={params.search ?? ""} onChange={onSearch} placeholder="Search patients…" className="sm:w-72" />
          <FilterDropdown label="Conditions" value={params.condition ?? ""} options={CONDITION_OPTIONS} onChange={onCondition} />
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={url.reset}>
              <X /> Clear filters
            </Button>
          )}
        </div>
        {patients.isError ? (
          <ErrorState message={patients.error.message} onRetry={() => patients.refetch()} />
        ) : (
          <>
            <PatientsTable
              rows={patients.data?.items}
              isLoading={patients.isLoading}
              isFetching={patients.isFetching && !patients.isLoading}
              showDoctor={false}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              empty={
                hasFilters ? (
                  <EmptyState icon={Users} title="No patients match your filters" action={<Button variant="outline" size="sm" onClick={url.reset}>Clear filters</Button>} />
                ) : (
                  <EmptyState icon={Users} title="No patients yet" description="This doctor has no patients assigned." action={<Button size="sm" onClick={() => setAddOpen(true)}><Plus /> Add patient</Button>} />
                )
              }
            />
            {patients.data && patients.data.pagination.total > 0 && (
              <Pagination pagination={patients.data.pagination} onPageChange={onPage} onLimitChange={onLimit} isFetching={patients.isFetching} />
            )}
          </>
        )}
      </section>

      {d && (
        <>
          <DoctorFormDialog open={editOpen} onOpenChange={setEditOpen} doctor={d} />
          <DeleteDoctorDialog doctor={deleteDoctorOpen ? d : null} onOpenChange={(o) => !o && setDeleteDoctorOpen(false)} onDeleted={() => router.replace("/doctors")} />
          <PatientFormDialog open={addOpen} onOpenChange={setAddOpen} lockedDoctor={{ id: d.id, name: d.name }} />
        </>
      )}
      <PatientFormDialog open={!!editingPatient} onOpenChange={(o) => !o && setEditingPatient(null)} patient={editingPatient} />
      <PatientDetailsDialog patient={viewing} onOpenChange={(o) => !o && setViewing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Remove ${deleting?.fullName ?? "patient"}?`}
        description="This permanently deletes the patient from this doctor’s list. This action cannot be undone."
        confirmLabel="Delete patient"
        destructive
        loading={del.isPending}
        onConfirm={() => deleting && del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}

export default function DoctorDetailPage() {
  return (
    <Suspense>
      <DoctorDetail />
    </Suspense>
  );
}
