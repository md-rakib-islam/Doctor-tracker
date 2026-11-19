"use client";

import { addDays, startOfMonth, subDays, subMonths } from "date-fns";
import { CalendarDays, X } from "lucide-react";
import { memo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDate, fromApiDate, toApiDate } from "@/lib/format";

export interface DateRangeValue {
  from?: string;
  to?: string;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  placeholder?: string;
  presets?: boolean;
  clearable?: boolean;
  className?: string;
}

const PRESETS: { label: string; range: () => DateRange }[] = [
  { label: "Last 7 days", range: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: "Last 30 days", range: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: "Last 90 days", range: () => ({ from: subDays(new Date(), 89), to: new Date() }) },
  { label: "This month", range: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: "Last 6 months", range: () => ({ from: subMonths(addDays(new Date(), 1), 6), to: new Date() }) },
];

export const DateRangePicker = memo(function DateRangePicker({
  value,
  onChange,
  placeholder = "Registration date",
  presets = true,
  clearable = true,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const selected: DateRange | undefined = value.from
    ? { from: fromApiDate(value.from), to: value.to ? fromApiDate(value.to) : undefined }
    : undefined;

  const apply = (r: DateRange | undefined) =>
    onChange({ from: r?.from ? toApiDate(r.from) : undefined, to: r?.to ? toApiDate(r.to) : undefined });

  const label = value.from
    ? value.to && value.to !== value.from
      ? `${formatDate(value.from)} – ${formatDate(value.to)}`
      : formatDate(value.from)
    : placeholder;

  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button variant="outline" className="h-9 w-full justify-start gap-2 font-normal sm:w-auto" aria-label={placeholder} />
          }
        >
          <CalendarDays className="size-4 text-muted-foreground" />
          <span className={value.from ? "" : "text-muted-foreground"}>{label}</span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto max-w-[calc(100vw-1.5rem)] gap-0 p-0">
          <div className="flex flex-col sm:flex-row">
            {presets && (
              <div className="flex flex-row gap-1 overflow-x-auto border-b p-2 sm:w-36 sm:flex-col sm:border-r sm:border-b-0">
                {PRESETS.map((p) => (
                  <Button
                    key={p.label}
                    variant="ghost"
                    size="sm"
                    className="justify-start whitespace-nowrap"
                    onClick={() => {
                      apply(p.range());
                      setOpen(false);
                    }}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            )}
            <Calendar
              mode="range"
              selected={selected}
              defaultMonth={selected?.from}
              onSelect={(r) => {
                apply(r);
                if (r?.from && r?.to) setOpen(false);
              }}
              disabled={{ after: new Date() }}
              numberOfMonths={1}
            />
          </div>
        </PopoverContent>
      </Popover>
      {clearable && value.from && (
        <Button variant="ghost" size="icon" aria-label="Clear date filter" onClick={() => onChange({})}>
          <X />
        </Button>
      )}
    </div>
  );
});
