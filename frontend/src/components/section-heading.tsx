import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = "View all",
}: {
  eyebrow: string;
  title: React.ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-6 border-b border-line pb-6">
      <div>
        <p className="eyebrow text-clay">{eyebrow}</p>
        <h2 className="display mt-3 text-[2.5rem] md:text-6xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="eyebrow group mb-2 hidden shrink-0 items-center gap-2 sm:inline-flex">
          <span className="link-draw pb-1">{linkLabel}</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
        </Link>
      )}
    </div>
  );
}
