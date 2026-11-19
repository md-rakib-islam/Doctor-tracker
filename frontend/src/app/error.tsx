"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <ErrorState message={error.message || "An unexpected error occurred."} onRetry={reset} />
    </div>
  );
}
