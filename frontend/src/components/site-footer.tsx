import { Suspense } from "react";
import Link from "next/link";
import { getMenu, type NavNode } from "@/lib/nav";
import { NewsletterForm } from "./newsletter-form";

/** Columns from Admin → Navigation → Footer (Shop, Help and Kosha until one is saved) */
async function MenuColumns() {
  const columns = await getMenu("footer");
  return columns.map((col) => <FooterColumn key={col.id} column={col} />);
}

function FooterColumn({ column }: { column: NavNode }) {
  return (
    <div>
      {column.href ? (
        <Link href={column.href} className="eyebrow text-canvas/50 hover:text-canvas">
          {column.label}
        </Link>
      ) : (
        <p className="eyebrow text-canvas/50">{column.label}</p>
      )}
      {column.children.length > 0 && (
        <ul className="mt-5 space-y-3">
          {column.children.map((l) => (
            <li key={l.id}>
              {l.href ? (
                <Link href={l.href} className="link-draw text-sm text-canvas/85 hover:text-canvas">
                  {l.label}
                </Link>
              ) : (
                <span className="text-sm text-canvas/85">{l.label}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink text-canvas">
      <div className="container-x grid gap-14 pb-10 pt-20 md:grid-cols-12 md:pt-28">
        <div className="md:col-span-5">
          <p className="eyebrow text-clay">The Kosha letter</p>
          <h2 className="display mt-5 max-w-md text-4xl md:text-5xl">
            New weaves, first. <em className="italic text-canvas/60">Once a month.</em>
          </h2>
          <NewsletterForm />
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:col-span-6 md:col-start-7">
          <Suspense fallback={null}>
            <MenuColumns />
          </Suspense>
        </div>
      </div>

      <div className="container-x overflow-hidden">
        <p
          aria-hidden
          className="display select-none whitespace-nowrap text-center text-[22vw] leading-[0.8] text-canvas/[0.06] md:text-[17vw]"
        >
          Kosha
        </p>
      </div>

      <div className="border-t border-canvas/10">
        <div className="container-x flex flex-col gap-3 py-6 text-xs text-canvas/50 md:flex-row md:items-center md:justify-between">
          <p>© {2026} Kosha. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-canvas">Privacy</Link>
            <Link href="/terms" className="hover:text-canvas">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
