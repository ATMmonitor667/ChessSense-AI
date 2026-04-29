"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { v4 as uuid } from "uuid";

import PuzzleBoard from "@/components/PuzzleBoard";
import MoveFeedbackCard from "@/components/MoveFeedbackCard";
import { gradeMove } from "@/lib/chess/grade";
import { LAST_SESSION_STORAGE_KEY } from "@/lib/lastSessionKey";
import { parseCoachStyle } from "@/lib/puzzles/coachStyles";
import { buildSessionQueue } from "@/lib/puzzles/index";
import type { Attempt } from "@/types/attempt";
import type { Puzzle } from "@/types/puzzle";

function parseLen(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 10;
  return Math.min(50, Math.floor(n));
}

function highlightFromUci(uci: string) {
  const u = uci.trim().toLowerCase();
  return { from: u.slice(0, 2), to: u.slice(2, 4) };
}

export default function SessionTrainer() {
  const router = useRouter();
  const search = useSearchParams();
  const style = useMemo(
    () => parseCoachStyle(search.get("style")),
    [search],
  );
  const length = useMemo(
    () => parseLen(search.get("length")),
    [search],
  );

  const queue = useMemo(() => buildSessionQueue(style, length), [style, length]);
  const [idx, setIdx] = useState(0);
  const puzzle = queue[idx];

  const [nonce, setNonce] = useState(0);

  const [userSan, setUserSan] = useState<string | null>(null);
  const [userUci, setUserUci] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [gradeResult, setGradeResult] = useState<ReturnType<
    typeof gradeMove
  > | null>(null);

  const [feedback, setFeedback] = useState("");
  const [feedbackPending, setFeedbackPending] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const attemptsRef = useRef<Attempt[]>([]);
  const lastAttemptIdRef = useRef<string | null>(null);

  useEffect(() => {
    attemptsRef.current = attempts;
  }, [attempts]);

  useEffect(() => {
    startTransition(() => {
      setUserSan(null);
      setUserUci(null);
      setSubmitted(false);
      setGradeResult(null);
      setFeedback("");
      setFeedbackPending(false);
      setFeedbackError(null);
      setNonce((n) => n + 1);
    });
  }, [idx, puzzle?.id]);

  const onMovePlayed = useCallback((san: string, uci: string) => {
    if (submitted) return;
    setUserSan(san);
    setUserUci(uci);
  }, [submitted]);

  const highlights = useMemo(() => {
    if (!submitted || !puzzle || !gradeResult || !userUci) return undefined;
    const user = highlightFromUci(userUci);
    const best = highlightFromUci(puzzle.bestMoveUci);
    return {
      userFrom: user.from,
      userTo: user.to,
      bestFrom: best.from,
      bestTo: best.to,
    };
  }, [submitted, puzzle, gradeResult, userUci]);

  const requestFeedback = async (
    p: Puzzle,
    score: number,
    san: string,
    uci: string,
  ): Promise<{ ok: boolean; text: string; err: string | null }> => {
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fen: p.fen,
          style: p.style,
          prompt: p.prompt,
          userMoveSan: san,
          userMoveUci: uci,
          bestMove: p.bestMove,
          bestLine: p.bestLine,
          score,
        }),
      });

      let data: {
        feedback?: string;
        error?: string | unknown;
      };

      try {
        data = (await res.json()) as typeof data;
      } catch {
        return {
          ok: false,
          text: "",
          err: `Feedback response was not readable (HTTP ${res.status}).`,
        };
      }

      if (!res.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : "Feedback request failed.";
        return { ok: false, text: "", err: msg };
      }
      return {
        ok: true,
        text: String(data.feedback ?? ""),
        err: null,
      };
    } catch {
      return {
        ok: false,
        text: "",
        err: "Network error while fetching feedback.",
      };
    }
  };

  const handleSubmit = async () => {
    if (!puzzle || submitted || !userUci || !userSan) return;
    const g = gradeMove(puzzle, userUci);
    setSubmitted(true);
    setGradeResult(g);

    const id = uuid();
    const ts = new Date().toISOString();
    const base: Attempt = {
      id,
      puzzleId: puzzle.id,
      userMoveSan: userSan,
      userMoveUci: userUci,
      bestMove: puzzle.bestMove,
      score: g.score,
      grade: g.grade,
      feedback: "",
      createdAt: ts,
    };
    setAttempts((prev) => [...prev, base]);
    lastAttemptIdRef.current = id;

    setFeedbackPending(true);
    setFeedbackError(null);
    setFeedback("");

    const result = await requestFeedback(puzzle, g.score, userSan, userUci);

    setFeedbackPending(false);

    const fbText = result.ok ? result.text : "";
    const err = result.ok ? null : result.err ?? "Unknown error.";

    setFeedback(result.ok ? fbText : "");
    setFeedbackError(err);

    setAttempts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, feedback: result.ok ? fbText : "" } : a,
      ),
    );
  };

  const retryFeedback = async () => {
    if (!puzzle || !userSan || !userUci || gradeResult === null) return;
    setFeedbackPending(true);
    setFeedbackError(null);
    setFeedback("");

    const result = await requestFeedback(
      puzzle,
      gradeResult.score,
      userSan,
      userUci,
    );
    setFeedbackPending(false);

    const fbText = result.ok ? result.text : "";
    const err = result.ok ? null : result.err ?? "Unknown error.";
    setFeedback(result.ok ? fbText : "");
    setFeedbackError(err);

    const aid = lastAttemptIdRef.current;
    if (aid) {
      setAttempts((prev) =>
        prev.map((a) =>
          a.id === aid ? { ...a, feedback: result.ok ? fbText : "" } : a,
        ),
      );
    }
  };

  const handleResetPosition = () => {
    if (submitted) return;
    setUserSan(null);
    setUserUci(null);
    setNonce((n) => n + 1);
  };

  const finishSession = () => {
    const payload = {
      style,
      lengthRequested: length,
      attempts: attemptsRef.current,
    };
    try {
      sessionStorage.setItem(LAST_SESSION_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
    router.push("/results");
  };

  const goNext = () => {
    if (idx >= queue.length - 1) {
      finishSession();
      return;
    }
    setIdx((i) => i + 1);
  };

  if (!queue.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-medium">
          No puzzles for this style yet. Pick another mode.
        </p>
        <Link
          href="/train"
          className="mt-6 inline-block text-blue-600 underline dark:text-blue-400"
        >
          Back to style selection
        </Link>
      </div>
    );
  }

  const progress = `${idx + 1} / ${queue.length}`;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-500">
        <span className="capitalize">{style}</span>
        <span aria-label={`Puzzle ${idx + 1} of ${queue.length}`}>
          Puzzle <span className="font-medium text-zinc-700 dark:text-zinc-300">{puzzle.id}</span>
          {" · "}
          {progress}
        </span>
      </div>

      <article className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Your move ({puzzle.sideToMove === "white" ? "White" : "Black"})
        </h1>
        <p className="text-zinc-700 dark:text-zinc-300">{puzzle.prompt}</p>

        <PuzzleBoard
          key={`${puzzle.id}-${nonce}`}
          fen={puzzle.fen}
          orientation={
            puzzle.sideToMove === "black" ? "black" : "white"
          }
          interactive={!submitted}
          highlights={
            highlights
              ? {
                  userFrom: highlights.userFrom ?? null,
                  userTo: highlights.userTo ?? null,
                  bestFrom: highlights.bestFrom ?? null,
                  bestTo: highlights.bestTo ?? null,
                }
              : undefined
          }
          onMovePlayed={onMovePlayed}
        />

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            disabled={submitted || !userUci}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white enabled:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 dark:disabled:opacity-50"
            onClick={() => void handleSubmit()}
          >
            Submit move
          </button>
          <button
            type="button"
            disabled={submitted}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-900"
            onClick={handleResetPosition}
          >
            Reset position
          </button>
          <button
            type="button"
            className="ml-auto rounded-lg border border-transparent px-2 py-2 text-sm text-zinc-600 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            onClick={finishSession}
          >
            End session early
          </button>
        </div>

        {gradeResult && submitted && puzzle ? (
          <MoveFeedbackCard
            grade={gradeResult.grade}
            score={gradeResult.score}
            bestMoveSan={puzzle.bestMove}
            bestLine={puzzle.bestLine}
            feedback={feedback}
            feedbackPending={feedbackPending}
            feedbackError={feedbackError}
            onRetryFeedback={() => void retryFeedback()}
          />
        ) : null}

        {gradeResult ? (
          <div className="pt-2">
            <button
              type="button"
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto sm:min-w-[200px]"
              onClick={goNext}
            >
              {idx >= queue.length - 1 ? "View results" : "Next puzzle"}
            </button>
          </div>
        ) : null}
      </article>

      <p className="mt-10 text-center text-sm text-zinc-500">
        <Link className="underline" href="/train">
          Change mode
        </Link>
        {" · "}
        <Link className="underline" href="/">
          Home
        </Link>
      </p>
    </div>
  );
}
