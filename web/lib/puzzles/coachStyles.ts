import type { Style } from "@/types/puzzle";

/** Single source of truth for training styles (labels + Train form + URL parsing). */
export const COACH_STYLE_OPTIONS: {
  id: Style;
  label: string;
  hint: string;
}[] = [
  { id: "tactical", label: "Tactical", hint: "Combos & tactics" },
  { id: "aggressive", label: "Aggressive", hint: "Forcing attacks" },
  { id: "defensive", label: "Defensive", hint: "Holding resources" },
  {
    id: "positional",
    label: "Positional",
    hint: "Structure & patience",
  },
  { id: "endgame", label: "Endgame", hint: "Technique mode" },
  { id: "engine", label: "Engine", hint: "Objectively best moves" },
];

export const COACH_STYLE_IDS: Style[] = COACH_STYLE_OPTIONS.map((s) => s.id);

export function parseCoachStyle(raw: string | null, fallback: Style = "tactical"): Style {
  if (raw && (COACH_STYLE_IDS as string[]).includes(raw)) return raw as Style;
  return fallback;
}
