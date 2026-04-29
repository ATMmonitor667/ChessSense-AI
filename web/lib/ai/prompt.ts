import type { Style } from "@/types/puzzle";

export function buildCoachPrompt(input: {
  fen: string;
  style: Style;
  puzzlePrompt: string;
  userMoveSan: string;
  bestMove: string;
  bestLine: string[];
  score: number;
}): string {
  const line = input.bestLine.join(" ");
  return `You are a friendly chess coach.

The user is solving a chess puzzle.

Position FEN:
${input.fen}

Style mode:
${input.style}

Puzzle prompt:
${input.puzzlePrompt}

User move:
${input.userMoveSan}

Best move:
${input.bestMove}

Best continuation:
${line}

User score:
${input.score}

Explain:
1. Whether the user's move was good or bad.
2. Why the best move works.
3. How the best move matches the selected style.
4. What chess concept the user should learn.
5. Keep the explanation under 120 words.
6. Use simple and encouraging language.`;
}
