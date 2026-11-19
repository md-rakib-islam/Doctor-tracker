import { HeartPulse } from "lucide-react";
import { APP_NAME } from "@/constants";

export function Brand({ light }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <HeartPulse className="size-[18px]" />
      </span>
      <span className={`text-[15px] font-semibold tracking-tight ${light ? "text-sidebar-accent-foreground" : ""}`}>{APP_NAME}</span>
    </div>
  );
}
