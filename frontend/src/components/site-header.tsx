import Link from "next/link";
import { BagButton } from "./cart/bag-button";
import { NAV_LINKS } from "@/lib/content";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { SearchBar, SearchButton } from "./search-overlay";
import { WishlistLink } from "./wishlist-button";
import { User } from "lucide-react";

// Display is set per element (inline-flex vs hidden md:inline-flex) so the classes never conflict
const iconButton = "size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas">
      {/* Logo on the left (after the menu button below desktop), category links centred on desktop,
          icons on the right. The equal 1fr side columns keep the links truly centred. */}
      <div className="container-x flex h-[4.5rem] items-center md:grid md:h-[4.5rem] md:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center gap-1">
          <MobileNav />
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

        {/* Pinned to the last column: on tablets the hidden links would otherwise pull the icons into the middle */}
        <div className="ml-auto flex items-center justify-end gap-0.5 md:col-start-3 md:gap-1">
          {/* Phones search from the bar below; larger screens use this icon */}
          <SearchButton className={`${iconButton} hidden md:inline-flex`} />
          <WishlistLink className={`${iconButton} inline-flex`} />
          <BagButton className={iconButton} />
          {/* Customer accounts aren't built yet: the icon is in place but does nothing for now */}
          <button type="button" aria-label="My account (coming soon)" title="Coming soon" className={`${iconButton} inline-flex`}>
            <User className="size-[1.15rem]" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div className="container-x pb-3 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
