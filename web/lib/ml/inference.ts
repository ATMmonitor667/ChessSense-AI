import path from "node:path";

import type { InferenceSession } from "onnxruntime-node";

import { GRADE_CLASS_ORDER } from "./constants";

import type { Grade } from "@/types/attempt";

let sess: InferenceSession | null | undefined;

export function resetOnnxCoachCache(): void {
  sess = undefined;
}

async function resolveSession(): Promise<InferenceSession | null> {
  if (sess !== undefined) return sess;

  const cwd = process.cwd();
  const paths = [
    process.env.ML_COACH_MODEL_PATH?.trim(),
    path.join(cwd, "artifacts", "coach.onnx"),
    path.join(cwd, "web", "artifacts", "coach.onnx"),
  ].filter(Boolean) as string[];

  const ort = await import("onnxruntime-node");

  for (const fp of [...new Set(paths)]) {
    try {
      sess = await ort.InferenceSession.create(fp, {
        executionProviders: ["cpu"],
      });
      return sess;
    } catch {
      sess = undefined;
    }
  }
  sess = null;
  return null;
}

function softmax(logits: number[]): number[] {
  let mx = logits[0] ?? 0;
  for (const x of logits) if (Number.isFinite(x) && x > mx) mx = x;
  const exp = logits.map((v) =>
    Number.isFinite(v) ? Math.exp(v - mx) : 0,
  );
  const s = exp.reduce((a, b) => a + b, 0);
  return exp.map((e) => e / (s || 1));
}

export async function tryMlCoach(
  feats: Float32Array,
  minConfidence: number,
): Promise<
  | {
      ok: true;
      grade: Grade;
      confidence: number;
      probs: number[];
    }
  | { ok: false; reason: string }
> {
  const session = await resolveSession();
  if (!session) return { ok: false, reason: "missing_onnx_file" };

  const ort = await import("onnxruntime-node");

  try {
    const inName =
      typeof session.inputNames[0] === "string"
        ? session.inputNames[0]
        : "input";
    const inp = new ort.Tensor("float32", feats, [1, feats.length]);

    /* eslint-disable @typescript-eslint/no-explicit-any */

    const out = (await session.run({ [inName]: inp })) as Record<string, any>;

    const candidateKey =
      Object.keys(out || {}).find((k) =>
        /^(logits|scores|prob|labels|variable|output_\d+)/i.test(k),
      ) ?? session.outputNames[0];

    const rawTensor = candidateKey ? out[candidateKey] : undefined;

    if (!rawTensor?.data || !(rawTensor.data instanceof Float32Array)) {
      return { ok: false, reason: "onnx_bad_tensor" };
    }

    const logits = [...rawTensor.data];
    if (logits.length < 5)
      return { ok: false, reason: "onnx_logits_shape" };

    const probs = softmax(logits);
    let bi = 0;
    probs.forEach((p, i) => {
      if (p > (probs[bi] ?? 0)) bi = i;
    });
    const confidence = probs[bi] ?? 0;
    const grade = (GRADE_CLASS_ORDER[
      Math.min(4, Math.max(0, bi))
    ] ?? "Inaccuracy") as Grade;

    if (confidence < minConfidence) {
      return { ok: false, reason: "confidence_below_threshold" };
    }
    return { ok: true, grade, confidence, probs };
  } catch {
    sess = undefined;
    return { ok: false, reason: "onnx_infer_failed" };
  }
}
