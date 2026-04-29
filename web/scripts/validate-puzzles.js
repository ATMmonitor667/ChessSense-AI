#!/usr/bin/env node
/**
 * Validates lib/puzzles/puzzles.json: FEN loads, bestMoveUci is legal with matching SAN heuristic.
 */
const { Chess } = require("chess.js");
const puzzles = require("../lib/puzzles/puzzles.json");

function uciParts(uci) {
  const norm = String(uci).trim().toLowerCase();
  return {
    from: norm.slice(0, 2),
    to: norm.slice(2, 4),
    promotion:
      norm.length >= 5
        ? ({ q: "q", r: "r", b: "b", n: "n" }[norm[4]] ?? undefined)
        : undefined,
  };
}

let failed = false;
for (const p of puzzles) {
  const c = new Chess(p.fen);
  const stm = c.turn();
  if (stm !== (p.sideToMove === "white" ? "w" : "b")) {
    console.error(`sideToMove mismatch ${p.id}: expected ${stm}`);
    failed = true;
    continue;
  }
  const { from, to, promotion } = uciParts(p.bestMoveUci);
  const m = c.move({ from, to, promotion });
  if (!m) {
    console.error(`illegal bestMoveUci ${p.id}`, p.bestMoveUci);
    failed = true;
    continue;
  }
  if (p.bestMove.replace(/[+#!]/g, "") !== m.san.replace(/[+#!]/g, "")) {
    console.warn(
      `SAN note ${p.id}: json "${p.bestMove}" vs chess.js "${m.san}"`,
    );
  }
  for (const alt of p.alsoGoodMovesUci ?? []) {
    const c2 = new Chess(p.fen);
    const a = uciParts(alt);
    const m2 = c2.move({ from: a.from, to: a.to, promotion: a.promotion });
    if (!m2) {
      console.error(`illegal alt ${p.id}`, alt);
      failed = true;
    }
  }
}
console.log(`Checked ${puzzles.length} puzzles.`);
if (failed) process.exit(1);
