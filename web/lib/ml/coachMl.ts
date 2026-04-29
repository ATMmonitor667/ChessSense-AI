import type { Style } from "@/types/puzzle";

import type { Grade } from "@/types/attempt";

/** Short non-generative explanation when ONNX coach head is trusted. */
export function buildMlCoachParagraph(input: {
  style: Style;
  gradeGuess: Grade;
  confidence: number;
  userMoveSan: string;
  bestMove: string;
  bestLine: string[];
  scoreShown: number;
}): string {
  const line = input.bestLine.join(" ");
  const pct = Math.round(input.confidence * 100);

  let opener: string;
  switch (input.gradeGuess) {
    case "Excellent":
      opener =
        "Your move matched the authored idea—nice calculation for this motif.";
      break;
    case "Good":
      opener =
        "You found a workable alternative that still fits this style puzzle.";
      break;
    case "Inaccuracy":
      opener =
        "The move is playable, but another idea expresses the puzzle theme more cleanly.";
      break;
    case "Mistake":
      opener =
        "This swings the evaluation—look for forcing lines that match the puzzle prompt.";
      break;
    case "Blunder":
      opener =
        "That punishes badly here—replay the defender’s weakest square and replay from there.";
      break;
    default:
      opener = "Interesting effort—compare with the authored line.";
  }

  return [
    opener,
    `Style focus: ${input.style}; your move was ${input.userMoveSan} (shown score ${input.scoreShown}).`,
    `Best move: ${input.bestMove}.`,
    line ? `Short line: ${line}.` : "",
    `(Local ONNX coach • estimated ${pct}% certainty on grade class.)`,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
