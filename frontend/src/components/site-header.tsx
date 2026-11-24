import Link from "next/link";
import { BagButton } from "./cart/bag-button";
import { NAV_LINKS } from "@/lib/content";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { SearchBar, SearchButton } from "./search-overlay";
import { WishlistLink } from "./wishlist-button";

// Display is set per element (inline-flex vs hidden md:inline-flex) so the classes never conflict
const iconButton = "size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas">
      <div className="container-x grid h-[4.5rem] grid-cols-[1fr_auto_1fr] items-center md:h-20">
        <div className="flex items-center">
          <MobileNav />
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="eyebrow link-draw pb-1 text-ink-soft hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Logo />

        <div className="flex items-center justify-end gap-0.5 md:gap-1">
          {/* Phones search from the bar below; larger screens use this icon */}
          <SearchButton className={`${iconButton} hidden md:inline-flex`} />
          <WishlistLink className={`${iconButton} hidden md:inline-flex`} />
          <BagButton className={iconButton} />
        </div>
      </div>
      <div className="container-x pb-3 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
