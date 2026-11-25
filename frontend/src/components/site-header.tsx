import { Suspense } from "react";
import { BagButton } from "./cart/bag-button";
import { getMenu } from "@/lib/nav";
import { HeaderMenu } from "./header-menu";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { SearchBar, SearchButton } from "./search-overlay";
import { WishlistLink } from "./wishlist-button";
import { User } from "lucide-react";

// Display is set per element (inline-flex vs hidden md:inline-flex) so the classes never conflict
const iconButton = "size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand";

export function SiteHeader() {
  return (
    // `sticky` makes the header the anchor for the desktop dropdown panel (see HeaderMenu)
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas">
      {/* Logo on the left (after the menu button below desktop), menu links centred on desktop,
          icons on the right. The side columns are equal (and never narrower than their content), so the
          links stay centred; links that don't fit the middle move into "More". */}
      <div className="container-x flex h-[4.5rem] items-center md:grid md:h-[4.5rem] md:grid-cols-[1fr_auto_1fr] lg:grid-cols-[minmax(max-content,1fr)_minmax(0,5fr)_minmax(max-content,1fr)] lg:gap-6">
        <div className="flex items-center gap-1">
          {/* The menu button works straight away; its links arrive with the data */}
          <Suspense fallback={<MobileNav items={[]} />}>
            <MobileNavWithMenu />
          </Suspense>
          <Logo align="start" />
        </div>

        <nav aria-label="Main" className="hidden min-w-0 lg:block">
          <Suspense fallback={null}>
            <DesktopMenu />
          </Suspense>
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

/** Header links from Admin → Navigation (the categories until a menu is saved) */
async function DesktopMenu() {
  return <HeaderMenu items={await getMenu("header")} />;
}

async function MobileNavWithMenu() {
  return <MobileNav items={await getMenu("header")} />;
}
