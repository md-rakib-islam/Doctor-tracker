"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column, type SortState } from "@/components/shared/data-table";
import { RowActions } from "@/components/shared/row-actions";
import { formatDate } from "@/lib/format";
import type { Doctor } from "@/types";
import { DoctorAvatar } from "./doctor-avatar";

interface DoctorsTableProps {
  rows: Doctor[] | undefined;
  isLoading?: boolean;
  isFetching?: boolean;
  sort: SortState;
  onSortChange: (s: SortState) => void;
  onView: (d: Doctor) => void;
  onEdit: (d: Doctor) => void;
  onDelete: (d: Doctor) => void;
  empty?: React.ReactNode;
}

export function DoctorsTable({ rows, isLoading, isFetching, sort, onSortChange, onView, onEdit, onDelete, empty }: DoctorsTableProps) {
  const columns = useMemo<Column<Doctor>[]>(
    () => [
      {
        key: "name",
        header: "Doctor",
        sortKey: "name",
        cell: (d) => (
          <Link href={`/doctors/${d.id}`} className="group flex items-center gap-3">
            <DoctorAvatar name={d.name} />
            <span className="font-medium group-hover:text-primary group-hover:underline">{d.name}</span>
          </Link>
        ),
      },
      { key: "spec", header: "Specialization", cell: (d) => d.specialization },
      { key: "hospital", header: "Hospital", hideBelow: "md", cell: (d) => <span className="text-muted-foreground">{d.hospital}</span> },
      { key: "phone", header: "Phone", hideBelow: "lg", cell: (d) => <span className="whitespace-nowrap text-muted-foreground">{d.phone}</span> },
      { key: "email", header: "Email", hideBelow: "lg", cell: (d) => <span className="text-muted-foreground">{d.email}</span> },
      {
        key: "patients",
        header: "Patients",
        className: "text-center",
        cell: (d) => (
          <Badge variant={d.patientCount ? "secondary" : "outline"} className="tabular-nums">
            {d.patientCount}
          </Badge>
        ),
      },
      { key: "created", header: "Registered", sortKey: "createdAt", hideBelow: "sm", cell: (d) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(d.createdAt)}</span> },
      {
        key: "actions",
        header: "",
        className: "w-12 text-right",
        cell: (d) => (
          <div className="flex justify-end">
            <RowActions label={d.name} onView={() => onView(d)} onEdit={() => onEdit(d)} onDelete={() => onDelete(d)} />
          </div>
        ),
      },
    ],
    [onView, onEdit, onDelete],
  );

  return (
    <DataTable columns={columns} rows={rows} rowKey={(d) => d.id} isLoading={isLoading} isFetching={isFetching} sort={sort} onSortChange={onSortChange} empty={empty} />
  );
}
