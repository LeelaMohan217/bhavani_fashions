import type { Metadata } from "next";
import Link from "next/link";
import { INFO_PAGES, type InfoPageKey } from "@/lib/info-pages";

export const infoMetadata = (key: InfoPageKey): Metadata => ({
  title: INFO_PAGES[key].title,
  description: INFO_PAGES[key].intro,
});

/** Shared layout for the footer information pages (content still to come from the store). */
export function InfoPage({ page }: { page: InfoPageKey }) {
  const { title, eyebrow, intro } = INFO_PAGES[page];

  return (
    <div className="container-x pb-24 pt-10 md:pb-32 md:pt-16">
      <nav aria-label="Breadcrumb" className="eyebrow flex items-center gap-2 text-stone">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span aria-hidden>/</span>
        <span className="text-ink">{title}</span>
      </nav>

      <div className="mt-8 max-w-3xl">
        <p className="eyebrow text-clay">{eyebrow}</p>
        <h1 className="display mt-3 text-[3rem] md:text-[4.5rem]">{title}</h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-soft">{intro}</p>

        <div className="mt-12 border border-dashed border-line px-6 py-14 text-center md:py-20">
          <p className="display text-2xl">Full details coming soon</p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-stone">
            We&rsquo;re putting the final words together. In the meantime, our team is happy to answer
            any question on WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
}
