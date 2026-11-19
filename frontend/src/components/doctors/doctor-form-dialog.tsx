"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { useCreateDoctor, useUpdateDoctor } from "@/hooks/use-doctors";
import { ApiError } from "@/lib/api-client";
import { doctorSchema, type DoctorFormValues } from "@/schemas/doctor";
import type { Doctor } from "@/types";

interface DoctorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided the dialog edits this doctor; otherwise it creates one. */
  doctor?: Doctor | null;
}

const FORM_ID = "doctor-form";

function DoctorForm({ doctor, onDone }: { doctor?: Doctor | null; onDone: () => void }) {
  const create = useCreateDoctor();
  const update = useUpdateDoctor();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: doctor?.name ?? "",
      specialization: doctor?.specialization ?? "",
      hospital: doctor?.hospital ?? "",
      phone: doctor?.phone ?? "",
      email: doctor?.email ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (doctor) await update.mutateAsync({ id: doctor.id, values });
      else await create.mutateAsync(values);
      onDone();
    } catch (e) {
      if (e instanceof ApiError && e.errors?.length) {
        e.errors.forEach((fe) => setError(fe.field as keyof DoctorFormValues, { message: fe.message }));
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
      <FormField label="Full name" htmlFor="name" error={errors.name?.message} required className="sm:col-span-2">
        <Input id="name" placeholder="Dr. Jane Doe" autoComplete="off" aria-invalid={!!errors.name} {...register("name")} />
      </FormField>
      <FormField label="Specialization" htmlFor="specialization" error={errors.specialization?.message} required>
        <Input id="specialization" placeholder="Cardiology" aria-invalid={!!errors.specialization} {...register("specialization")} />
      </FormField>
      <FormField label="Hospital" htmlFor="hospital" error={errors.hospital?.message} required>
        <Input id="hospital" placeholder="Central Hospital" aria-invalid={!!errors.hospital} {...register("hospital")} />
      </FormField>
      <FormField label="Phone" htmlFor="phone" error={errors.phone?.message} required>
        <Input id="phone" type="tel" placeholder="+880 1700 000000" aria-invalid={!!errors.phone} {...register("phone")} />
      </FormField>
      <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
        <Input id="email" type="email" placeholder="doctor@hospital.org" aria-invalid={!!errors.email} {...register("email")} />
      </FormField>
    </form>
  );
}

export function DoctorFormDialog({ open, onOpenChange, doctor }: DoctorFormDialogProps) {
  const create = useCreateDoctor();
  const update = useUpdateDoctor();
  const isSubmitting = create.isPending || update.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={doctor ? "Edit doctor" : "Add doctor"}
      description={doctor ? "Update this doctor’s profile information." : "Register a new doctor in the system."}
      formId={FORM_ID}
      submitLabel={doctor ? "Save changes" : "Add doctor"}
      isSubmitting={isSubmitting}
    >
      <DoctorForm doctor={doctor} onDone={() => onOpenChange(false)} />
    </FormDialog>
  );
}
