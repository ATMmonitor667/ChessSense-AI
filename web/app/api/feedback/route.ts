import { NextResponse } from "next/server";
import { type ZodError, z } from "zod";

import { buildCoachPrompt } from "@/lib/ai/prompt";
import { buildMlCoachParagraph } from "@/lib/ml/coachMl";
import { encodeCoachInput } from "@/lib/ml/encode";
import { tryMlCoach } from "@/lib/ml/inference";

const styleEnum = z.enum([
  "tactical",
  "aggressive",
  "defensive",
  "positional",
  "endgame",
  "engine",
]);

const bodySchema = z.object({
  fen: z.string(),
  style: styleEnum,
  prompt: z.string(),
  userMoveSan: z.string(),
  /** Required for ONNX coach inference (parity with heuristic grading). */
  userMoveUci: z.string().min(4),
  bestMove: z.string(),
  bestLine: z.array(z.string()),
  score: z.number(),
});

function fallbackStaticCopy(): string {
  return "Coach service is offline — compare your move to the best line printed above, replay the arrows slowly, then restate what the defender’s worst weakness was.";
}

/** Structured logs — no positions or secrets (FEN/OpenAI bodies excluded). */
function logFeedback(
  event: string,
  meta: Record<string, string | number | boolean | string[]> = {},
): void {
  try {
    console.info(
      JSON.stringify({ svc: "chesssense-feedback", event, ...meta }),
    );
  } catch {
    /* ignore */
  }
}

function validationErrorPayload(error: ZodError) {
  const flat = error.flatten();
  const pairs = Object.entries(flat.fieldErrors)
    .filter(([, errs]) => Array.isArray(errs) && errs.length)
    .map(([key, errs]) => `${key}: ${(errs as string[]).join("; ")}`);
  const summary =
    pairs.length > 0
      ? pairs.join(" · ")
      : flat.formErrors.length > 0
        ? flat.formErrors.join(" · ")
        : "Invalid request body";
  return {
    error: summary,
    fieldErrors: flat.fieldErrors,
  };
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    logFeedback("invalid_json_body", {});
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    logFeedback("validation_failed", {
      fields: Object.keys(flat.fieldErrors),
    });
    const body = validationErrorPayload(parsed.error);
    return NextResponse.json(body, { status: 400 });
  }

  const data = parsed.data;

  const mlMin =
    Number.parseFloat(process.env.ML_COACH_MIN_CONF ?? "0.38");
  const threshold =
    Number.isFinite(mlMin) ? Math.min(1, Math.max(0.05, mlMin)) :
    0.38;

  const feats = encodeCoachInput(data.fen, data.userMoveUci);
  const ml = await tryMlCoach(feats, threshold);

  if (ml.ok) {
    logFeedback("coach_path", {
      path: "ml-onnx",
      confidence: ml.confidence,
      grade: ml.grade,
      style: data.style,
    });
    const feedback = buildMlCoachParagraph({
      style: data.style,
      gradeGuess: ml.grade,
      confidence: ml.confidence,
      userMoveSan: data.userMoveSan,
      bestMove: data.bestMove,
      bestLine: data.bestLine,
      scoreShown: data.score,
    });
    return NextResponse.json({
      feedback,
      source: "ml-onnx",
      mlConfidence: ml.confidence,
      mlGrade: ml.grade,
    });
  }

  /** Fall back to OpenAI when ONNX missing, inference failed, or low confidence. */
  logFeedback("coach_path", {
    path: "openai_fallback",
    ml_ok: ml.ok === false ? 1 : 0,
    ml_reason: ml.ok === false ? ml.reason : "n/a",
    style: data.style,
  });

  const userPrompt = buildCoachPrompt({
    fen: data.fen,
    style: data.style,
    puzzlePrompt: data.prompt,
    userMoveSan: data.userMoveSan,
    bestMove: data.bestMove,
    bestLine: data.bestLine,
    score: data.score,
  });

  const apiKey = process.env.OPENAI_API_KEY;
  const model =
    process.env.OPENAI_MODEL ??
    process.env.OPEN_AI_MODEL ??
    "gpt-4o-mini";

  if (!apiKey) {
    logFeedback("coach_path", { path: "offline_no_api_key", style: data.style });
    return NextResponse.json({
      feedback: fallbackStaticCopy(),
      source: "offline",
      mlAttempt: ml,
    });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: userPrompt }],
        max_tokens: 320,
        temperature: 0.6,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      logFeedback("openai_http_error", {
        status: res.status,
        style: data.style,
        errHead: errText.slice(0, 120),
      });
      return NextResponse.json(
        {
          feedback: fallbackStaticCopy(),
          source: "offline-after-openai-error",
          mlAttempt: ml,
          warning: `OpenAI API (${res.status}): ${errText}`,
        },
        { status: 200 },
      );
    }

    const completion = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text =
      completion.choices?.[0]?.message?.content?.trim() ?? "";

    if (!text) {
      logFeedback("coach_path", { path: "offline-empty-completion", style: data.style });
      return NextResponse.json(
        {
          feedback: fallbackStaticCopy(),
          source: "offline-empty-completion",
          mlAttempt: ml,
        },
        { status: 200 },
      );
    }

    logFeedback("coach_path", { path: "openai", style: data.style });
    return NextResponse.json({
      feedback: text,
      source: "openai",
      mlAttempt: ml,
    });
  } catch {
    logFeedback("coach_path", { path: "offline-network", style: data.style });
    return NextResponse.json(
      {
        feedback: fallbackStaticCopy(),
        source: "offline-network",
        mlAttempt: ml,
      },
      { status: 200 },
    );
  }
}
