"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";

import { LAST_SESSION_STORAGE_KEY } from "@/lib/lastSessionKey";
import ResultsSummary, {
  type ResultsPayload,
} from "@/components/ResultsSummary";

type LoadOutcome = "working" | "ready";

export default function ResultsClient() {
  const [phase, setPhase] = useState<LoadOutcome>("working");
  const [data, setData] = useState<ResultsPayload | null>(null);
  /** Distinguishes empty storage from corrupted stored JSON */
  const [storageIssue, setStorageIssue] = useState<
    "none" | "missing" | "corrupt"
  >("missing");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_SESSION_STORAGE_KEY);
      if (!raw) {
        startTransition(() => {
          setStorageIssue("missing");
          setData(null);
          setPhase("ready");
        });
        return;
      }
      const parsed = JSON.parse(raw) as ResultsPayload;
      startTransition(() => {
        setStorageIssue("none");
        setData(parsed);
        setPhase("ready");
      });
    } catch {
      startTransition(() => {
        setStorageIssue("corrupt");
        setData(null);
        setPhase("ready");
      });
    }
  }, []);

  if (phase !== "ready") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p
          role="status"
          aria-busy="true"
          aria-live="polite"
          className="text-zinc-600 dark:text-zinc-400"
        >
          Loading results…
        </p>
      </div>
    );
  }

  if (storageIssue === "corrupt") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
          Saved results could not be read
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Browser storage contained invalid data — start a fresh session or try
          private browsing restrictions.
        </p>
        <Link
          href="/train"
          className="mt-8 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-950"
        >
          Start training
        </Link>
      </div>
    );
  }

  if (!data || !data.attempts?.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
          No session data
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Finish a puzzle session first; results appear here once you tap
          &quot;View results&quot; after the last puzzle.
        </p>
        <Link
          href="/train"
          className="mt-8 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-950"
        >
          Start training
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
        Session results
      </h1>
      <div className="mt-8">
        <ResultsSummary data={data} />
      </div>
    </div>
  );
}
