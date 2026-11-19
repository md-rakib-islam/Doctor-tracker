"use client";

import { memo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ALL = "__all__";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  /** Label of the clear option; defaults to "All <label>". */
  allLabel?: string;
}

export const FilterDropdown = memo(function FilterDropdown({
  label,
  value,
  options,
  onChange,
  className,
  disabled,
  allLabel,
}: FilterDropdownProps) {
  const items = [{ value: ALL, label: allLabel ?? `All ${label.toLowerCase()}` }, ...options];
  return (
    <Select
      value={value || ALL}
      items={items}
      disabled={disabled}
      onValueChange={(v) => onChange(v === ALL || v == null ? "" : String(v))}
    >
      <SelectTrigger size="default" className={`h-9 w-full sm:w-auto sm:min-w-40 ${className ?? ""}`} aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start" className="min-w-52">
        {items.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});
