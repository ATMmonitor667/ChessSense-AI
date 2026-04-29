import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex max-w-3xl flex-col gap-12 px-6 py-20 sm:py-28">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
            ChessSense AI
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
            Train your chess{" "}
            <span className="text-blue-700 dark:text-blue-300">
              in a chosen style
            </span>
            .
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            Pick a mode (tactical, aggressive, defensive, and more), play the
            best move on a real position, get instant grading versus the
            authored line, then read a short AI coach note—focused on ideas,
            not just engine numbers.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/train"
              className="inline-flex rounded-xl bg-zinc-900 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Start training
            </Link>
            <Link
              href="/session?style=tactical&length=10"
              className="inline-flex rounded-xl border border-zinc-300 px-6 py-3 text-base font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              Quick tactical set
            </Link>
          </div>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          <li className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="font-semibold text-zinc-900 dark:text-white">
              Legal-move board
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Illegal tries snap back instantly; submit when you commit to your
              choice.
            </p>
          </li>
          <li className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="font-semibold text-zinc-900 dark:text-white">
              Grade & best line
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              See your move and the solution highlighted, plus a short best
              continuation in SAN.
            </p>
          </li>
          <li className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="font-semibold text-zinc-900 dark:text-white">
              Coach feedback
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Optional OpenAI-powered explanations (env key) with offline-style
              fallback text.
            </p>
          </li>
          <li className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="font-semibold text-zinc-900 dark:text-white">
              Session summary
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              End-screen stats and simple guidance on what to practise next.
            </p>
          </li>
        </ul>
      </div>
    </div>
  );
}
