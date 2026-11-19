"use client";

import { Mail, Phone, Stethoscope } from "lucide-react";
import Link from "next/link";
import { ConditionBadge } from "@/components/shared/badges";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { capitalize, formatDateTime } from "@/lib/format";
import type { Patient } from "@/types";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

export function PatientDetailsDialog({ patient, onOpenChange }: { patient: Patient | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={!!patient} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {patient && (
          <>
            <DialogHeader>
              <DialogTitle>{patient.fullName}</DialogTitle>
              <DialogDescription>
                {patient.age} years · {capitalize(patient.gender)}
              </DialogDescription>
            </DialogHeader>
            <dl className="divide-y">
              <Row label="Condition">
                <ConditionBadge condition={patient.condition} />
              </Row>
              <Row label="Phone">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5 text-muted-foreground" />
                  {patient.phone}
                </span>
              </Row>
              <Row label="Email">
                {patient.email ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="size-3.5 text-muted-foreground" />
                    {patient.email}
                  </span>
                ) : (
                  <span className="font-normal text-muted-foreground">Not provided</span>
                )}
              </Row>
              <Row label="Assigned doctor">
                {patient.doctor ? (
                  <Link href={`/doctors/${patient.doctor.id}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                    <Stethoscope className="size-3.5" />
                    {patient.doctor.name}
                  </Link>
                ) : (
                  "—"
                )}
              </Row>
              {patient.doctor && <Row label="Specialization">{patient.doctor.specialization}</Row>}
              <Row label="Registered">{formatDateTime(patient.createdAt)}</Row>
              <Row label="Last updated">{formatDateTime(patient.updatedAt)}</Row>
            </dl>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
