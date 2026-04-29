import type { Move } from "chess.js";

/** UCI move string from chess.js Move (handles promotion last char). */
export function moveToUci(move: Move): string {
  const base = `${move.from}${move.to}`;
  if (move.promotion) {
    return `${base}${move.promotion.toLowerCase()}`;
  }
  return base;
}
