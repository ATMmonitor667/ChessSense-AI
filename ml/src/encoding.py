#!/usr/bin/env python3
"""Board encoder — must mirror web/lib/ml/encode.ts."""

from __future__ import annotations

import chess

MODEL_INPUT_DIM = 900

FILES = tuple("abcdefgh")
TYPE_RANK = {"p": 0, "n": 1, "b": 2, "r": 3, "q": 4, "k": 5}


def algebraic_to_idx(name: str) -> int:
    f = ord(name[0]) - ord("a")
    rank = int(name[1])
    row = 8 - rank
    return row * 8 + f


def normalize_uci(uc: str) -> str:
    return uc.strip().lower().lstrip("=").replace("=", "")


def encode_coach_features(fen: str, user_move_uci: str) -> list[float]:
    board = chess.Board(fen)
    feats = [0.0] * MODEL_INPUT_DIM

    for sq in chess.SQUARES:
        p = board.piece_at(sq)
        if not p:
            continue
        nm = chess.square_name(sq)
        idx = algebraic_to_idx(nm)
        ti = TYPE_RANK[p.symbol().lower()]
        base = ti if p.color == chess.WHITE else ti + 6
        feats[base * 64 + idx] = 1.0

    feats[768] = 1.0 if board.turn == chess.WHITE else 0.0

    values = {"p": 1, "n": 3, "b": 3, "r": 5, "q": 9, "k": 0}
    mat = 0.0
    for sq in chess.SQUARES:
        pc = board.piece_at(sq)
        if not pc:
            continue
        v = values[pc.symbol().lower()]
        mat += v if pc.color == chess.WHITE else -v
    feats[769] = max(-1.0, min(1.0, mat / 24.0))

    parts = fen.split()
    castling = parts[2] if len(parts) > 2 else "-"
    feats[770] = 0.0 if castling == "-" else len(castling.replace("-", "")) / 4.0
    ep = parts[3] if len(parts) > 3 else "-"
    feats[771] = 0.0 if ep == "-" else 1.0

    u = normalize_uci(user_move_uci)
    f_from, f_to = u[:2], u[2:4] if len(u) >= 4 else ""
    if len(f_from) == 2:
        feats[772 + algebraic_to_idx(f_from)] = 1.0
    if len(f_to) == 2:
        feats[836 + algebraic_to_idx(f_to)] = 1.0

    return feats
