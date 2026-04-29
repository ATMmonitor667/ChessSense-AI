import type { Puzzle } from "@/types/puzzle";
import type { Style } from "@/types/puzzle";
import puzzlesJson from "./puzzles.json";

const ALL = puzzlesJson as Puzzle[];

export function listPuzzles(): readonly Puzzle[] {
  return ALL;
}

export function getPuzzlesByStyle(style: Style): Puzzle[] {
  return ALL.filter((p) => p.style === style);
}

/** Fisher–Yates shuffle (non-cryptographic, session-local). */
function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Puzzle order for a session: style-filtered, no repeats until pool exhausted,
 * capped at requested length or available puzzles.
 */
export function buildSessionQueue(style: Style, length: number): Puzzle[] {
  const pool = getPuzzlesByStyle(style);
  if (!pool.length) return [];
  const shuffled = shuffle(pool);
  return shuffled.slice(0, Math.min(length, shuffled.length));
}
