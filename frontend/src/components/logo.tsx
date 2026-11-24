import Link from "next/link";

export function Logo({ tone = "ink", align = "center" }: { tone?: "ink" | "canvas"; align?: "center" | "start" }) {
  return (
    <Link
      href="/"
      aria-label="Bhavani Fashion home"
      className={`group inline-flex flex-col leading-none ${align === "start" ? "items-start" : "items-center"} ${
        tone === "canvas" ? "text-canvas" : "text-ink"
      }`}
    >
      <span className="display text-[1.75rem] md:text-[2rem] tracking-[-0.03em]">Bhavani</span>
      <span className="eyebrow mt-1 text-[0.55rem] tracking-[0.5em] opacity-70 transition-opacity group-hover:opacity-100">
        Fashion
      </span>
    </Link>
  );
}
