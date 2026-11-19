"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormField } from "@/components/shared/form-field";
import { SelectField } from "@/components/shared/select-field";
import { Input } from "@/components/ui/input";
import { GENDERS, PATIENT_CONDITIONS } from "@/constants";
import { useAddDoctorPatient, useDoctorOptions } from "@/hooks/use-doctors";
import { useCreatePatient, useUpdatePatient } from "@/hooks/use-patients";
import { ApiError } from "@/lib/api-client";
import { patientSchema, toPatientPayload, type PatientFormInput } from "@/schemas/patient";
import type { Patient } from "@/types";

interface PatientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient | null;
  /** Pre-selects and locks the doctor (used from the doctor details page). */
  lockedDoctor?: { id: string; name: string };
}

const FORM_ID = "patient-form";
const GENDER_OPTIONS = GENDERS.map((g) => ({ value: g.value, label: g.label }));
const CONDITION_OPTIONS = PATIENT_CONDITIONS.map((c) => ({ value: c, label: c }));

function PatientForm({ patient, lockedDoctor, onDone }: { patient?: Patient | null; lockedDoctor?: { id: string; name: string }; onDone: () => void }) {
  const doctors = useDoctorOptions();
  const create = useCreatePatient();
  const update = useUpdatePatient();
  const addToDoctor = useAddDoctorPatient(lockedDoctor?.id ?? "");

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PatientFormInput>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      fullName: patient?.fullName ?? "",
      age: patient ? String(patient.age) : "",
      gender: patient?.gender,
      phone: patient?.phone ?? "",
      email: patient?.email ?? "",
      condition: patient?.condition as PatientFormInput["condition"] | undefined,
      doctorId: lockedDoctor?.id ?? patient?.doctorId ?? "",
    },
  });

  const doctorOptions = (doctors.data ?? []).map((d) => ({ value: d.id, label: `${d.name} · ${d.specialization}` }));

  const onSubmit = handleSubmit(async (raw) => {
    const values = toPatientPayload(raw);
    try {
      if (patient) await update.mutateAsync({ id: patient.id, values });
      else if (lockedDoctor) {
        await addToDoctor.mutateAsync(values);
      } else await create.mutateAsync(values);
      onDone();
    } catch (e) {
      if (e instanceof ApiError && e.errors?.length) {
        e.errors.forEach((fe) => setError(fe.field as keyof PatientFormInput, { message: fe.message }));
      } else {
        setError("root", { message: e instanceof Error ? e.message : "Something went wrong" });
      }
    }
  });

  return (
    <form id={FORM_ID} onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      {errors.root && (
        <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive sm:col-span-2">
          {errors.root.message}
        </p>
      )}
      <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message} required className="sm:col-span-2">
        <Input id="fullName" placeholder="Rahim Uddin" autoComplete="off" aria-invalid={!!errors.fullName} {...register("fullName")} />
      </FormField>
      <FormField label="Age" htmlFor="age" error={errors.age?.message} required>
        <Input id="age" inputMode="numeric" placeholder="34" aria-invalid={!!errors.age} {...register("age")} />
      </FormField>
      <FormField label="Gender" htmlFor="gender" error={errors.gender?.message} required>
        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <SelectField id="gender" value={field.value ?? ""} onChange={field.onChange} options={GENDER_OPTIONS} placeholder="Select gender" invalid={!!errors.gender} />
          )}
        />
      </FormField>
      <FormField label="Phone" htmlFor="phone" error={errors.phone?.message} required>
        <Input id="phone" type="tel" placeholder="+880 1800 000000" aria-invalid={!!errors.phone} {...register("phone")} />
      </FormField>
      <FormField label="Email" htmlFor="email" error={errors.email?.message} hint="Optional">
        <Input id="email" type="email" placeholder="patient@example.com" aria-invalid={!!errors.email} {...register("email")} />
      </FormField>
      <FormField label="Condition" htmlFor="condition" error={errors.condition?.message} required>
        <Controller
          control={control}
          name="condition"
          render={({ field }) => (
            <SelectField id="condition" value={field.value ?? ""} onChange={field.onChange} options={CONDITION_OPTIONS} placeholder="Select condition" invalid={!!errors.condition} />
          )}
        />
      </FormField>
      <FormField label="Assigned doctor" htmlFor="doctorId" error={errors.doctorId?.message} required>
        <Controller
          control={control}
          name="doctorId"
          render={({ field }) => (
            <SelectField
              id="doctorId"
              value={field.value}
              onChange={field.onChange}
              options={lockedDoctor ? [{ value: lockedDoctor.id, label: lockedDoctor.name }] : doctorOptions}
              placeholder={doctors.isLoading ? "Loading doctors…" : "Select doctor"}
              invalid={!!errors.doctorId}
              disabled={!!lockedDoctor}
            />
          )}
        />
      </FormField>
    </form>
  );
}

export function PatientFormDialog({ open, onOpenChange, patient, lockedDoctor }: PatientFormDialogProps) {
  const create = useCreatePatient();
  const update = useUpdatePatient();
  const addToDoctor = useAddDoctorPatient(lockedDoctor?.id ?? "");
  const isSubmitting = create.isPending || update.isPending || addToDoctor.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={patient ? "Edit patient" : lockedDoctor ? `Add patient to ${lockedDoctor.name}` : "Add patient"}
      description={patient ? "Update this patient’s information." : "Register a patient and assign them to a doctor."}
      formId={FORM_ID}
      submitLabel={patient ? "Save changes" : "Add patient"}
      isSubmitting={isSubmitting}
    >
      <PatientForm patient={patient} lockedDoctor={lockedDoctor} onDone={() => onOpenChange(false)} />
    </FormDialog>
  );
}
