import type { Puzzle } from "@/types/puzzle";
import type { Grade } from "@/types/attempt";

export type GradeResult = {
  grade: Grade;
  score: number;
};

/**
 * Phase A heuristic grading (README / PROJECT_PLAN).
 * Matches best move exactly → Excellent; alt in alsoGoodMovesUci → Good; otherwise bands by heuristic.
 */
export function gradeMove(
  puzzle: Puzzle,
  userMoveUci: string,
): GradeResult {
  const norm = normalizeUci(userMoveUci);
  if (norm === normalizeUci(puzzle.bestMoveUci)) {
    return { grade: "Excellent", score: 100 };
  }
  const alts = puzzle.alsoGoodMovesUci?.map(normalizeUci) ?? [];
  if (alts.includes(norm)) {
    return { grade: "Good", score: 92 };
  }
  /* Legal but not thematic — MVP bands without Engine */
  /* Slightly soften by difficulty for variety */
  const d = puzzle.difficulty;
  if (d <= 2) {
    return { grade: "Inaccuracy", score: 68 };
  }
  if (d === 3) {
    return { grade: "Mistake", score: 45 };
  }
  return { grade: "Blunder", score: 18 };
}

function normalizeUci(u: string): string {
  return u.trim().toLowerCase();
}
