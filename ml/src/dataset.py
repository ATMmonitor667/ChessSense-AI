#!/usr/bin/env python3
from __future__ import annotations

import json
import random
from pathlib import Path

import chess

from encoding import encode_coach_features
from grading import heuristic_grade_bucket

RNG = random.Random(42)


def load_puzzles(path: Path) -> list[dict]:
    return json.loads(path.read_text(encoding="utf-8"))


def normalized_move_uci(m: chess.Move) -> str:
    return m.uci().lower().replace("=", "")


def build_dataset(puzzle_path: Path, samples_per_board: int = 40):
    puzzles = load_puzzles(puzzle_path)
    X: list[list[float]] = []
    y: list[int] = []

    for pz in puzzles:
        fen = str(pz["fen"])
        board = chess.Board(fen)
        best_uci_raw = str(pz["bestMoveUci"]).lower().replace("=", "")
        alt = [str(x).lower().replace("=", "") for x in (pz.get("alsoGoodMovesUci") or [])]
        difficulty = int(pz.get("difficulty", 2))

        legs = sorted(board.legal_moves, key=lambda _mv: RNG.random())[
            : max(samples_per_board, 8)
        ]

        pairs: list[tuple[str, int]] = []

        for mv in legs:
            u = normalized_move_uci(mv)
            lab = heuristic_grade_bucket(best_uci_raw, alt, difficulty, u)
            pairs.append((u, lab))

        for _repeat in range(3):
            labs = heuristic_grade_bucket(
                best_uci_raw, alt, difficulty, best_uci_raw,
            )
            pairs.append((best_uci_raw, labs))

        for uci, lab in pairs:
            feats = encode_coach_features(fen, uci.replace("=", ""))
            if len(feats) != 900:
                raise RuntimeError("feature dim mismatch")
            X.append(feats)
            y.append(int(lab))

    return X, y
