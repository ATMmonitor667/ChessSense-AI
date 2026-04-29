import Link from "next/link";

import type { Style } from "@/types/puzzle";

const STYLES: { id: Style; label: string; hint: string }[] = [
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

export default function TrainPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
        Choose a style
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Puzzles are filtered to match the mode so prompts and solutions stay
        coherent.
      </p>

      <form
        className="mt-10 space-y-8"
        action="/session"
        method="get"
      >
        <fieldset>
          <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Style
          </legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {STYLES.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 has-[:checked]:border-blue-500 has-[:checked]:ring-2 has-[:checked]:ring-blue-500/30 dark:border-zinc-800 dark:bg-zinc-950 dark:has-[:checked]:border-blue-400"
              >
                <input
                  type="radio"
                  name="style"
                  value={s.id}
                  defaultChecked={s.id === "tactical"}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium text-zinc-900 dark:text-white">
                    {s.label}
                  </span>
                  <span className="text-sm text-zinc-500">{s.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="length"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Session length
          </label>
          <input
            id="length"
            name="length"
            type="number"
            min={1}
            max={50}
            defaultValue={10}
            className="mt-2 block w-32 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Start training
        </button>
      </form>

      <p className="mt-10 text-center text-sm text-zinc-500">
        <Link className="underline" href="/">
          Back to home
        </Link>
      </p>
    </div>
  );
}
