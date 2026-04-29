# ChessSense coach model (training)

Tiny **five-class graded-move learner** aligned with MVP grades (`Excellent` … `Blunder`).
Trained from `web/lib/puzzles/puzzles.json`, augmenting random legal-move negatives via
match `web/lib/chess/grade.ts` heuristic.

## Setup

```bash
cd ml
python -m venv .venv
# .venv\Scripts\activate  (Windows)

pip install -r requirements.txt
```

## Train weights + ONNX

```bash
cd src
python train.py
python export_onnx.py
```

Outputs:

| File | Purpose |
|------|---------|
| `web/artifacts/coach.pt` | PyTorch `state_dict` |
| `web/artifacts/coach.onnx` | Production inference |

**Encoder parity** must remain identical between:

- `ml/src/encoding.py`
- `web/lib/ml/encode.ts`

## Web runtime (`onnxruntime-node`)

`/api/feedback` loads `coach.onnx` (search paths documented in Next.js code).

| Env variable | Meaning |
|---|---|
| `ML_COACH_MODEL_PATH` | Explicit path to `coach.onnx` |
| `ML_COACH_MIN_CONF` | Confidence threshold `[0–1]` (softmax peak), default ~0.38 |

Flow: ONNX coach → confidence gate → optional OpenAI prose → deterministic offline fallback.
