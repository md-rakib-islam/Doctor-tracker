"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FilterOption } from "./filter-dropdown";

interface SelectFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder: string;
  invalid?: boolean;
  disabled?: boolean;
}

/** Form-bound select (no "All" option) used inside dialogs. */
export function SelectField({ id, value, onChange, options, placeholder, invalid, disabled }: SelectFieldProps) {
  return (
    <Select
      value={value || null}
      items={options}
      disabled={disabled}
      onValueChange={(v) => onChange(v == null ? "" : String(v))}
    >
      <SelectTrigger id={id} className="h-9 w-full" aria-invalid={invalid} disabled={disabled}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
