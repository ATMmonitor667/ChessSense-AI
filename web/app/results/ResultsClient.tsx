"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";

import ResultsSummary, {
  type ResultsPayload,
} from "@/components/ResultsSummary";

const STORAGE_KEY = "chesssense-last-session";

export default function ResultsClient() {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<ResultsPayload | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        startTransition(() => {
          setData(null);
          setReady(true);
        });
        return;
      }
      const parsed = JSON.parse(raw) as ResultsPayload;
      startTransition(() => {
        setData(parsed);
        setReady(true);
      });
    } catch {
      startTransition(() => {
        setData(null);
        setReady(true);
      });
    }
  }, []);

  if (!ready) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">Loading results…</p>
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
          Complete a training session first, or your results could not be
          loaded.
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
