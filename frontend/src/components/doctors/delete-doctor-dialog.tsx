"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SelectField } from "@/components/shared/select-field";
import { useDeleteDoctor, useDoctorOptions } from "@/hooks/use-doctors";
import { ApiError } from "@/lib/api-client";
import type { Doctor } from "@/types";

interface DeleteDoctorDialogProps {
  doctor: Doctor | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

function Body({ doctor, onOpenChange, onDeleted }: { doctor: Doctor; onOpenChange: (o: boolean) => void; onDeleted?: () => void }) {
  const del = useDeleteDoctor();
  const options = useDoctorOptions();
  const hasPatients = doctor.patientCount > 0;
  const [mode, setMode] = useState<"reassign" | "cascade">("reassign");
  const [target, setTarget] = useState("");
  const [error, setError] = useState<string | null>(null);

  const targets = (options.data ?? []).filter((d) => d.id !== doctor.id).map((d) => ({ value: d.id, label: `${d.name} · ${d.specialization}` }));
  const n = doctor.patientCount;

  const confirm = async () => {
    setError(null);
    try {
      await del.mutateAsync({
        id: doctor.id,
        ...(hasPatients && (mode === "reassign" ? { reassignTo: target } : { cascade: true })),
      });
      onOpenChange(false);
      onDeleted?.();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setError(e.message);
    }
  };

  return (
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      title={`Delete ${doctor.name}?`}
      description={
        hasPatients
          ? `${doctor.name} has ${n} patient${n === 1 ? "" : "s"}. Choose what should happen to them before deleting.`
          : "This permanently removes the doctor. This action cannot be undone."
      }
      confirmLabel="Delete doctor"
      destructive
      loading={del.isPending}
      confirmDisabled={hasPatients && mode === "reassign" && !target}
      onConfirm={confirm}
    >
      {hasPatients && (
        <fieldset className="space-y-3">
          <legend className="sr-only">Patient handling</legend>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-accent/50">
            <input type="radio" name="mode" className="mt-1 accent-[var(--primary)]" checked={mode === "reassign"} onChange={() => setMode("reassign")} />
            <span className="min-w-0 flex-1 space-y-2">
              <span className="block text-sm font-medium">Reassign patients to another doctor</span>
              {mode === "reassign" && (
                <SelectField id="reassign-to" value={target} onChange={setTarget} options={targets} placeholder="Select a doctor" />
              )}
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 has-[:checked]:border-destructive has-[:checked]:bg-destructive/5">
            <input type="radio" name="mode" className="mt-1 accent-[var(--destructive)]" checked={mode === "cascade"} onChange={() => setMode("cascade")} />
            <span className="text-sm">
              <span className="block font-medium">Delete doctor and {n} patient{n === 1 ? "" : "s"}</span>
              <span className="block text-muted-foreground">Patient records will be permanently removed.</span>
            </span>
          </label>
        </fieldset>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </ConfirmDialog>
  );
}

export function DeleteDoctorDialog({ doctor, onOpenChange, onDeleted }: DeleteDoctorDialogProps) {
  // Mounted only while a doctor is selected so local state resets between uses.
  return doctor ? <Body key={doctor.id} doctor={doctor} onOpenChange={onOpenChange} onDeleted={onDeleted} /> : null;
}
