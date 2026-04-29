/**
 * Canonical board + move encoder shared with ml/src/encoding.py (manual parity).
 */

import type { PieceSymbol } from "chess.js";
import type { Square } from "chess.js";
import { Chess } from "chess.js";

import { MODEL_INPUT_DIM } from "./constants";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

const TYPE_RANK: Partial<Record<PieceSymbol, number>> = {
  p: 0,
  n: 1,
  b: 2,
  r: 3,
  q: 4,
  k: 5,
};

export function squareNameToIdx(name: string): number {
  const file = name.charCodeAt(0)! - "a".charCodeAt(0);
  const rank = parseInt(name[1]!, 10);
  const row = 8 - rank;
  return row * 8 + file;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/** Normalize UCI for hashing planes (lowercase promotion). */
export function normalizeUciForMl(uci: string): string {
  return uci.trim().toLowerCase().replace(/^=/, "");
}

/**
 * Builds `[900]` features:
 * - `[0..768]` 12 piece planes × 64 (white PNBRQK then black pnbrqk)
 * - `[768..772]` stm, approximate material tilt, castling fullness, EP flag
 * - `[772..836]` from-square one-hot, `[836..900]` to-square (+ promotion overlaps to square)
 */
export function encodeCoachInput(fen: string, userMoveUci: string): Float32Array {
  const out = new Float32Array(MODEL_INPUT_DIM).fill(0);
  const g = new Chess(fen);

  const files = FILES;
  for (let rank = 8; rank >= 1; rank--) {
    for (let fi = 0; fi < 8; fi++) {
      const sq = `${files[fi]}${rank}` as Square;
      const p = g.get(sq);
      if (!p) continue;
      const ti = TYPE_RANK[p.type];
      if (ti === undefined) continue;
      const idx = squareNameToIdx(sq);
      const base = p.color === "w" ? ti : ti + 6;
      out[base * 64 + idx] = 1;
    }
  }

  out[768] = g.turn() === "w" ? 1 : 0;

  let mat = 0;
  const values: Record<PieceSymbol, number> = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0,
  };

  for (let rank = 8; rank >= 1; rank--) {
    for (let fi = 0; fi < 8; fi++) {
      const sq = `${files[fi]}${rank}` as Square;
      const p = g.get(sq);
      if (!p) continue;
      const v = values[p.type] ?? 0;
      mat += p.color === "w" ? v : -v;
    }
  }
  out[769] = clamp(mat / 24, -1, 1);

  const castling = fen.split(/\s+/)[2] ?? "-";
  out[770] =
    castling === "-" ? 0 : castling.replace(/-/g, "").length / 4;

  const ep = fen.split(/\s+/)[3] ?? "-";
  out[771] = ep === "-" ? 0 : 1;

  const u = normalizeUciForMl(userMoveUci);
  const from = u.slice(0, 2);
  const to = u.length >= 4 ? u.slice(2, 4) : "";
  if (from.length === 2)
    out[772 + squareNameToIdx(from)] = 1;
  if (to.length === 2)
    out[836 + squareNameToIdx(to)] = 1;

  return out;
}
