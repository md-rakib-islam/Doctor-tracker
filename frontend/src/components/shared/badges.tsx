import { Badge } from "@/components/ui/badge";
import { PATIENT_CONDITIONS } from "@/constants";
import { capitalize } from "@/lib/format";

// Soft tints so a condition is recognisable at a glance without a loud table.
const TINTS = [
  "bg-sky-50 text-sky-700 ring-sky-600/15",
  "bg-rose-50 text-rose-700 ring-rose-600/15",
  "bg-violet-50 text-violet-700 ring-violet-600/15",
  "bg-amber-50 text-amber-800 ring-amber-600/20",
  "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/15",
];

export function ConditionBadge({ condition }: { condition: string }) {
  const idx = Math.max(PATIENT_CONDITIONS.indexOf(condition as (typeof PATIENT_CONDITIONS)[number]), 0);
  return (
    <Badge variant="outline" className={`border-transparent ring-1 ring-inset ${TINTS[idx % TINTS.length]}`}>
      {condition}
    </Badge>
  );
}

export function GenderText({ gender }: { gender: string }) {
  return <span className="text-muted-foreground">{capitalize(gender)}</span>;
}
