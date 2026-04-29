import { Suspense } from "react";

import SessionTrainer from "./SessionTrainer";

export default function SessionPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-[40vh] items-center justify-center text-zinc-500"
          role="status"
          aria-busy="true"
          aria-live="polite"
        >
          Loading session…
        </div>
      }
    >
      <SessionTrainer />
    </Suspense>
  );
}
