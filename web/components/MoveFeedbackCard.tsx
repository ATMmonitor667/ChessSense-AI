"use client";

import type { Grade } from "@/types/attempt";

type Props = {
  grade: Grade;
  score: number;
  bestMoveSan: string;
  bestLine: string[];
  feedback: string;
  feedbackPending: boolean;
  feedbackError: string | null;
  onRetryFeedback: () => void;
};

export default function MoveFeedbackCard({
  grade,
  score,
  bestMoveSan,
  bestLine,
  feedback,
  feedbackPending,
  feedbackError,
  onRetryFeedback,
}: Props) {
  return (
    <div className="mt-6 w-full rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-lg font-semibold">{grade}</span>
        <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
          Score <strong>{score}</strong>
          <span className="opacity-70"> / 100</span>
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Best move:{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
          {bestMoveSan}
        </span>
      </p>
      {bestLine.length > 0 && (
        <p className="mt-1 font-mono text-sm text-zinc-700 dark:text-zinc-300">
          Continuation: {bestLine.join(" ")}
        </p>
      )}
      <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Coach
        </p>
        {feedbackPending && (
          <p className="animate-pulse text-sm text-zinc-500">
            Thinking up feedback…
          </p>
        )}
        {!feedbackPending && feedbackError && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {feedbackError}
            </p>
            <button
              type="button"
              className="rounded-lg border border-zinc-300 px-3 py-1 text-sm hover:bg-white dark:border-zinc-700 dark:hover:bg-zinc-900"
              onClick={onRetryFeedback}
            >
              Retry
            </button>
          </div>
        )}
        {!feedbackPending && !feedbackError && feedback && (
          <p className="text-sm leading-relaxed">{feedback}</p>
        )}
      </div>
    </div>
  );
}
