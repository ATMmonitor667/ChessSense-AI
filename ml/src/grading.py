#!/usr/bin/env python3
"""Heuristic labelling mirrored from apps web/lib/chess/grade.ts (phase A only)."""

from __future__ import annotations

GRADE_ORDER = ("Excellent", "Good", "Inaccuracy", "Mistake", "Blunder")


def norm_uci(u: str) -> str:
    return u.strip().lower().replace("=", "").replace("+", "").replace("#", "")


def heuristic_grade_bucket(
    best_uci: str,
    alt_list: list[str] | None,
    diff: int,
    user_uci: str,
) -> int:
    u = norm_uci(user_uci)
    if u == norm_uci(best_uci):
        return 0  # Excellent
    alts = [norm_uci(a) for a in (alt_list or [])]
    if u in alts:
        return 1  # Good
    if diff <= 2:
        return 2  # Inaccuracy
    if diff == 3:
        return 3  # Mistake
    return 4  # Blunder
