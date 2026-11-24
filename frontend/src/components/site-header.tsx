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
      {/* Phones: menu and logo on the left, wishlist and bag on the right. md+: logo centred. */}
      <div className="container-x flex h-[4.5rem] items-center md:grid md:h-20 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center gap-1">
          <MobileNav />
          <div className="md:hidden">
            <Logo align="start" />
          </div>
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

        <div className="hidden md:block">
          <Logo />
        </div>

        <div className="ml-auto flex items-center justify-end gap-0.5 md:gap-1">
          {/* Phones search from the bar below; larger screens use this icon */}
          <SearchButton className={`${iconButton} hidden md:inline-flex`} />
          <WishlistLink className={`${iconButton} inline-flex`} />
          <BagButton className={iconButton} />
        </div>
      </div>
      <div className="container-x pb-3 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
