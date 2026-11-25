import Link from "next/link";

/**
 * The Kosha mark: a silk moth, the moth whose cocoon gives us silk. Drawn in currentColor
 * so it always matches the wordmark beside it.
 */
export function SilkMothMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {/* Body */}
      <path d="M20 12v18" />
      {/* Fore wings */}
      <path d="M20 15C14 7 4 8 5 15s9 7 15 4" />
      <path d="M20 15c6-8 16-7 15 0s-9 7-15 4" />
      {/* Hind wings */}
      <path d="M20 21c-5 1-10 4-9 8s6 2 9-3" />
      <path d="M20 21c5 1 10 4 9 8s-6 2-9-3" />
      {/* Antennae */}
      <path d="M19 12c-1-3-3-4-5-4" />
      <path d="M21 12c1-3 3-4 5-4" />
    </svg>
  );
}

export function Logo({ tone = "ink", align = "center" }: { tone?: "ink" | "canvas"; align?: "center" | "start" }) {
  return (
    <Link
      href="/"
      aria-label="Kosha home"
      className={`group inline-flex items-center gap-1.5 leading-none ${align === "start" ? "justify-start" : "justify-center"} ${
        tone === "canvas" ? "text-canvas" : "text-ink"
      }`}
    >
      <SilkMothMark className="size-[1.7rem] shrink-0 transition-transform duration-500 ease-[var(--ease-editorial)] group-hover:-rotate-6 md:size-[1.9rem]" />
      <span className="display text-[1.85rem] md:text-[2.1rem] tracking-[-0.03em]">Kosha</span>
    </Link>
  );
}
