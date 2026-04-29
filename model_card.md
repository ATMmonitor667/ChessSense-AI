# Model & ethics card — ChessSense AI

This document satisfies **reflection + ethics** prompts for *Applied AI System* coursework. Fill bracketed items when you record your own video and collaboration story.

---

## System & data

- **Primary model:** `GradeHead` — MLP over a **900-dim** board/move encoding (see `ml/src/encoding.py` / `web/lib/ml/encode.ts`).
- **Labels:** Heuristic grade buckets aligned with `web/lib/chess/grade.ts` (Phase A), not perfect engine truth.
- **Optional text:** Chat completion API for narrative coach copy when ONNX path not used—subject to vendor policies.

---

## Limitations & biases

1. **Teaching signal is heuristic.** The network learns correlations with rule-based tiers; uncommon **brilliancies** marked “suboptimal” by heuristics can confuse both labels and narration expectations.
2. **Dataset size:** Curated puzzle JSON (~10+ positions in samples). Generalization beyond similar tactics is limited.
3. **Demographic fairness:** Chess positions do not encode user identity, but wording of prompts and prose may carry generic LLM tendencies when OpenAI is enabled.
4. **Promotion/normalization drift:** SAN/UCI edge cases must stay synchronized between TS and Python.

---

## Potential misuse & mitigations

| Risk | Mitigation |
|------|------------|
| Over-trusting prose as engine truth | UI shows **distinct heuristic grade vs coach text**; ONNX outputs include **confidence**. |
| Spamming paid APIs | Server-side fetch only with env keys; deterministic offline copy avoids bills for demos without keys. |
| Logging sensitive data | Structured logs omit FEN payloads; truncation on remote error blobs. |

---

## Reliability evaluation — surprises

_Use your experiments to replace this paragraph._

Running `evaluate.py` compared model argmax buckets to heuristic labels—the model **high agreement** on the augmented training mixture (expected—it fits in-distribution synthetic moves). Surprise: **confidence stayed high even near class boundaries**, which motivated keeping the softmax threshold conservative for production narrative.

---

## Human evaluation (optional note)

Briefly skim 5 puzzle coach outputs: check whether explanation aligns with SAN line on screen—not binary pass/fail, but detects gross hallucinations if OpenAI is enabled without position grounding.

---

## Collaboration with AI (course prompt)

_Complete honestly for grading._

### One helpful AI suggestion example

*[e.g.] Copilot/agent suggested refactoring API validation errors into readable strings (`error` summary + optional `fieldErrors`), improving student-facing error UX.*

### One flawed or misleading AI suggestion example

*[e.g.] Attempted to coerce `dtype=torch.int64` inside `np.array()`, which crashes—required reading Python traceback and switching to `np.int64`.*

---

## Portfolio reflection (≤200 words placeholder)

_Customize for instructors reviewing GitHub._

This project merges **hands-on reinforcement** (puzzle-solving loop) with a **narrow supervised head** demonstrating how small models bolt onto web apps with **gates and fallbacks**. I treated **traceability** (encode parity TS/Python, ONNX path vs LLM logged) as more important than raw accuracy on toy data. *[Add one sentence on what YOU want recruiters to infer about working style.]*

---

## Video artifact

**Loom / walk-through URL:** `[ADD YOUR VIDEO URL HERE]`
