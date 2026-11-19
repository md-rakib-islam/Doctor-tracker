import { initials } from "@/lib/format";

export function DoctorAvatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground ${
        size === "lg" ? "size-14 text-lg" : "size-8 text-xs"
      }`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
