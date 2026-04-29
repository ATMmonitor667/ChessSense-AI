from __future__ import annotations

from torch import Tensor, nn


class GradeHead(nn.Module):
    """Tiny MLP for 5-grade classification."""

    def __init__(self, dim_in: int = 900):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(dim_in, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.35),
            nn.Linear(256, 128),
            nn.ReLU(inplace=True),
            nn.Linear(128, 5),
        )

    def forward(self, x: Tensor) -> Tensor:
        logits = self.net(x)
        return logits
