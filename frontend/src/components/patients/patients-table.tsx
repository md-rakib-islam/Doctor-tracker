"use client";

import { useMemo } from "react";
import { ConditionBadge, GenderText } from "@/components/shared/badges";
import { DataTable, type Column, type SortState } from "@/components/shared/data-table";
import { RowActions } from "@/components/shared/row-actions";
import { formatDate } from "@/lib/format";
import type { Patient } from "@/types";
import Link from "next/link";

interface PatientsTableProps {
  rows: Patient[] | undefined;
  isLoading?: boolean;
  isFetching?: boolean;
  showDoctor?: boolean;
  sort?: SortState;
  onSortChange?: (s: SortState) => void;
  onView: (p: Patient) => void;
  onEdit: (p: Patient) => void;
  onDelete: (p: Patient) => void;
  empty?: React.ReactNode;
}

export function PatientsTable({ rows, isLoading, isFetching, showDoctor = true, sort, onSortChange, onView, onEdit, onDelete, empty }: PatientsTableProps) {
  const columns = useMemo<Column<Patient>[]>(
    () => [
      {
        key: "name",
        header: "Patient",
        sortKey: "fullName",
        cell: (p) => (
          <button type="button" onClick={() => onView(p)} className="text-left font-medium hover:text-primary hover:underline">
            {p.fullName}
          </button>
        ),
      },
      { key: "age", header: "Age", sortKey: "age", hideBelow: "sm", cell: (p) => <span className="tabular-nums">{p.age}</span> },
      { key: "gender", header: "Gender", hideBelow: "md", cell: (p) => <GenderText gender={p.gender} /> },
      { key: "phone", header: "Phone", hideBelow: "lg", cell: (p) => <span className="whitespace-nowrap text-muted-foreground">{p.phone}</span> },
      { key: "condition", header: "Condition", cell: (p) => <ConditionBadge condition={p.condition} /> },
      ...(showDoctor
        ? [
            {
              key: "doctor",
              header: "Assigned doctor",
              hideBelow: "md" as const,
              cell: (p: Patient) =>
                p.doctor ? (
                  <Link href={`/doctors/${p.doctor.id}`} className="hover:text-primary hover:underline">
                    {p.doctor.name}
                  </Link>
                ) : (
                  "—"
                ),
            },
          ]
        : []),
      { key: "created", header: "Registered", sortKey: "createdAt", hideBelow: "sm", cell: (p) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(p.createdAt)}</span> },
      {
        key: "actions",
        header: "",
        className: "w-12 text-right",
        cell: (p) => (
          <div className="flex justify-end">
            <RowActions label={p.fullName} onView={() => onView(p)} onEdit={() => onEdit(p)} onDelete={() => onDelete(p)} />
          </div>
        ),
      },
    ],
    [showDoctor, onView, onEdit, onDelete],
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(p) => p.id}
      isLoading={isLoading}
      isFetching={isFetching}
      sort={sort}
      onSortChange={onSortChange}
      empty={empty}
    />
  );
}
