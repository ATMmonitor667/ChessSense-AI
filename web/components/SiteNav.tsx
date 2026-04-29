import Link from "next/link";

export default function SiteNav() {
  return (
    <header className="border-b border-zinc-200 bg-background/95 backdrop-blur-md dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm">
        <Link
          href="/"
          className="font-semibold text-zinc-900 dark:text-white"
        >
          ChessSense
        </Link>
        <nav
          aria-label="Site"
          className="flex flex-wrap gap-x-5 gap-y-1 text-zinc-600 dark:text-zinc-400"
        >
          <Link className="hover:text-zinc-900 dark:hover:text-white" href="/train">
            Train
          </Link>
          <Link className="hover:text-zinc-900 dark:hover:text-white" href="/results">
            Results
          </Link>
        </nav>
      </div>
    </header>
  );
}
