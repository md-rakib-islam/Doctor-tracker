"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { memo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "./loading-skeleton";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Server-side sort field; makes the header clickable. */
  sortKey?: string;
  className?: string;
  /** Hide below this breakpoint to keep the table readable on small screens. */
  hideBelow?: "sm" | "md" | "lg";
}

export interface SortState {
  sortBy: string;
  order: "asc" | "desc";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  isLoading?: boolean;
  isFetching?: boolean;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  skeletonRows?: number;
  /** Rendered instead of the table body when there are no rows. */
  empty?: React.ReactNode;
}

const HIDE: Record<NonNullable<Column<unknown>["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

function DataTableInner<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  isFetching,
  sort,
  onSortChange,
  skeletonRows = 8,
  empty,
}: DataTableProps<T>) {
  if (isLoading) return <TableSkeleton rows={skeletonRows} columns={Math.min(columns.length, 5)} />;
  if (rows && rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className={`transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {columns.map((c) => {
              const active = !!c.sortKey && sort?.sortBy === c.sortKey;
              return (
                <TableHead
                  key={c.key}
                  className={`${c.hideBelow ? HIDE[c.hideBelow] : ""} ${c.className ?? ""} h-10 text-xs font-medium tracking-wide text-muted-foreground uppercase`}
                  aria-sort={active ? (sort!.order === "asc" ? "ascending" : "descending") : undefined}
                >
                  {c.sortKey && onSortChange ? (
                    <button
                      type="button"
                      className="-ml-1 inline-flex items-center gap-1 rounded px-1 uppercase hover:text-foreground"
                      onClick={() =>
                        onSortChange({
                          sortBy: c.sortKey!,
                          order: active && sort!.order === "asc" ? "desc" : "asc",
                        })
                      }
                    >
                      {c.header}
                      {active ? (
                        sort!.order === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-50" />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows?.map((row) => (
            <TableRow key={rowKey(row)}>
              {columns.map((c) => (
                <TableCell key={c.key} className={`${c.hideBelow ? HIDE[c.hideBelow] : ""} ${c.className ?? ""}`}>
                  {c.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export const DataTable = memo(DataTableInner) as typeof DataTableInner;
