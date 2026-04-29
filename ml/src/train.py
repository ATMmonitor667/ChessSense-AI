#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F

from dataset import build_dataset
from model import GradeHead


def main() -> None:
    repo = Path(__file__).resolve().parents[2]
    puzzle_src = repo / "web" / "lib" / "puzzles" / "puzzles.json"
    artifact_dir = repo / "web" / "artifacts"
    artifact_dir.mkdir(parents=True, exist_ok=True)

    Xl, yl = build_dataset(puzzle_src)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    X = torch.tensor(np.array(Xl, dtype=np.float32), device=device)
    y = torch.tensor(np.array(yl, dtype=np.int64), device=device)

    model = GradeHead(dim_in=X.shape[1]).to(device)
    optim = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-4)

    epochs = 120
    batch = 128
    n = len(X)

    for ep in range(1, epochs + 1):
        perm = torch.randperm(n)
        losses: list[float] = []
        for i in range(0, n, batch):
            idx = perm[i : i + batch]
            logits = model(X[idx])
            loss = F.cross_entropy(logits, y[idx])
            optim.zero_grad()
            loss.backward()
            optim.step()
            losses.append(float(loss.detach().cpu().item()))

        if ep % 20 == 0 or ep == 1:
            with torch.no_grad():
                logits = model(X)
                preds = logits.argmax(dim=1)
                acc = float((preds == y).float().mean().cpu().item())
            print(f"epoch {ep:03d} loss {np.mean(losses):.4f} acc {acc:.3f}")

    torch.save(model.state_dict(), artifact_dir / "coach.pt")
    print("Saved", artifact_dir / "coach.pt")


if __name__ == "__main__":
    main()
