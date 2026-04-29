import type { Square } from "chess.js";
import type { Move } from "chess.js";

const FILES = "abcdefgh";

export function squareToCoords(square: string): { file: number; rank: number } {
  const file = FILES.indexOf(square[0]!);
  const rank = parseInt(square[1]!, 10) - 1;
  return { file, rank };
}

/** UCI move string from chess.js Move (handles promotion last char). */
export function moveToUci(move: Move): string {
  const base = `${move.from}${move.to}`;
  if (move.promotion) {
    return `${base}${move.promotion.toLowerCase()}`;
  }
  return base;
}

export function coordsToSquare(file: number, rank: number): Square {
  return `${FILES[file]}${rank + 1}` as Square;
}
