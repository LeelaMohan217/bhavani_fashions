import Link from "next/link";

export function Logo({ tone = "ink", align = "center" }: { tone?: "ink" | "canvas"; align?: "center" | "start" }) {
  return (
    <Link
      href="/"
      aria-label="Kosha home"
      className={`group inline-flex flex-col leading-none ${align === "start" ? "items-start" : "items-center"} ${
        tone === "canvas" ? "text-canvas" : "text-ink"
      }`}
    >
      <span className="display text-[1.85rem] md:text-[2.1rem] tracking-[-0.03em]">Kosha</span>
    </Link>
  );
}
