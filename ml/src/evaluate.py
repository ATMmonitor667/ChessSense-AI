#!/usr/bin/env python3
"""Evaluate GradeHead weights against heuristic labels (same augmented data as train.py).

Run from repo ml/src:

    python evaluate.py

Exits with 0 — prints aggregate accuracy so you can quote it in coursework (e.g. testing summary).
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import torch

from encoding import MODEL_INPUT_DIM
from dataset import build_dataset
from model import GradeHead
from grading import GRADE_ORDER


def main() -> int:
    repo = Path(__file__).resolve().parents[2]
    puzzle_src = repo / "web" / "lib" / "puzzles" / "puzzles.json"
    ckpt = repo / "web" / "artifacts" / "coach.pt"

    if not ckpt.exists():
        print(f"Missing checkpoint: {ckpt}\nTrain first: python train.py")
        return 1

    Xl, yl = build_dataset(puzzle_src)
    n = len(yl)
    if n == 0:
        print("Empty dataset.")
        return 1

    X = torch.tensor(np.asarray(Xl, dtype=np.float32))
    y = torch.tensor(np.asarray(yl, dtype=np.int64))

    net = GradeHead(dim_in=MODEL_INPUT_DIM).eval()
    net.load_state_dict(torch.load(ckpt, map_location="cpu", weights_only=False))

    with torch.no_grad():
        logits = net(X)
        probs = torch.softmax(logits, dim=1)
        conf = probs.max(dim=1).values
        pred = logits.argmax(dim=1)

    correct = int((pred == y).sum().item())
    acc = correct / n
    mean_conf = float(conf.mean().item())

    per_class_tp = [0] * 5
    per_class_n = [0] * 5
    for t, yi in enumerate(y.numpy().tolist()):
        per_class_n[yi] += 1
        if pred[t].item() == yi:
            per_class_tp[yi] += 1

    print("=== ChessSense coach evaluation (held-style: full augmented set) ===")
    print(f"Samples (rows):           {n}")
    print(f"Agreement with heuristic: {correct}/{n} ({acc:.1%})")
    print(f"Mean softmax confidence:  {mean_conf:.4f}")

    print("\nPer-label recall (fraction of heuristic labels recovered):")
    for i, name in enumerate(GRADE_ORDER):
        pc = per_class_n[i]
        if pc == 0:
            print(f"  {name:12} n=0")
        else:
            print(f"  {name:12} {per_class_tp[i]}/{pc} ({100 * per_class_tp[i] / pc:.1f}%)")

    print(
        " Labels come from heuristic rules (mirror web/lib/chess/grade.ts). "
        "High agreement means the learner tracks those rules, not absolute chess truth.",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
