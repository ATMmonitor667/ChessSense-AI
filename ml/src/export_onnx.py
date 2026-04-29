#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

import numpy as np
import torch

from encoding import MODEL_INPUT_DIM, encode_coach_features
from model import GradeHead


def main() -> None:
    repo = Path(__file__).resolve().parents[2]
    web_art = repo / "web" / "artifacts"
    pt = web_art / "coach.pt"
    out_onnx = web_art / "coach.onnx"

    net = GradeHead(dim_in=MODEL_INPUT_DIM)
    ck = torch.load(pt, map_location="cpu", weights_only=False)
    net.load_state_dict(ck, strict=True)
    net.eval()

    dummy = encode_coach_features(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "e2e4",
    )

    inp = torch.tensor(np.asarray(dummy, dtype=np.float32).reshape(1, -1))

    torch.onnx.export(
        net,
        inp,
        out_onnx,
        input_names=["input"],
        output_names=["scores"],
        dynamo=False,
        opset_version=17,
    )
    print("ONNX exported to", out_onnx)


if __name__ == "__main__":
    main()
