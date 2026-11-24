import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <section className="container-x flex min-h-[65vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow text-clay">Error 404</p>
      <h1 className="display mt-6 text-6xl md:text-8xl">
        Lost in the <em className="italic">weave.</em>
      </h1>
      <p className="mt-6 max-w-sm text-sm leading-relaxed text-stone">
        The page you&rsquo;re looking for has moved, sold out, or never existed.
      </p>
      <Link
        href="/shop"
        className="eyebrow group mt-10 inline-flex items-center gap-3 bg-ink px-7 py-[1.1rem] text-canvas transition-colors hover:bg-clay-deep"
      >
        Continue shopping
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
      </Link>
    </section>
  );
}
