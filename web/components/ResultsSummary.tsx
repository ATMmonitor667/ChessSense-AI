"use client";

import Link from "next/link";
import type { Style } from "@/types/puzzle";
import type { Attempt } from "@/types/attempt";

export type ResultsPayload = {
  style: Style;
  lengthRequested: number;
  attempts: Attempt[];
};

export default function ResultsSummary({ data }: { data: ResultsPayload }) {
  const n = data.attempts.length;
  const avg =
    n === 0
      ? 0
      : Math.round(
          data.attempts.reduce((s, a) => s + a.score, 0) / n,
        );
  const excellent =
    data.attempts.filter((a) => a.grade === "Excellent").length;

  const weak = avg < 70;
  const hint = weak
    ? "Your average score dipped—focus on slowing down before you commit."
    : "Solid session — keep chaining short calculation checks before moving.";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Positions" value={String(n)} />
        <Stat label="Excellent" value={`${excellent} / ${n}`} />
        <Stat label="Avg score" value={String(avg)} />
      </div>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
          Style: <span className="capitalize">{data.style}</span>
          {data.lengthRequested !== n ? (
            <span className="text-zinc-500">
              {" "}
              (shown {n} puzzles — fewer available in bank)
            </span>
          ) : null}
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{hint}</p>
        {!weak ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Try a different mode next (e.g.{" "}
            <strong>positional</strong> or <strong>endgame</strong>) to widen
            your pattern library.
          </p>
        ) : (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Repeat <strong>{data.style}</strong> training until average score is
            75+, then branch out.
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/train"
          className="inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Train again
        </Link>
        <Link
          href="/"
          className="inline-flex rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Home
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}
