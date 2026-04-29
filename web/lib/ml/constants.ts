/** Must match ml/src/encoding.py CLASS_NAMES order. */
export const GRADE_CLASS_ORDER = [
  "Excellent",
  "Good",
  "Inaccuracy",
  "Mistake",
  "Blunder",
] as const;

/** Input tensor size (planes + globals + move one-hot). */
export const MODEL_INPUT_DIM = 900;
