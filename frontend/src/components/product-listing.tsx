import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getCategory, getProductFilters, getProducts } from "@/lib/api";
import type { SortOption } from "@/lib/types";
import { listingHref, parseSelection, priceBandsInPaise, selectionCount, EMPTY_SELECTION } from "@/lib/shop-filters";
import { ProductCard } from "./product-card";
import { SortSelect } from "./sort-select";
import { FilterSheet } from "./filter-sheet";
import { ShopSidebar } from "./shop/shop-sidebar";
import { ProductGridSkeleton } from "./skeletons";

const SORTS: SortOption[] = ["featured", "newest", "price-asc", "price-desc"];
type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Shared listing for /shop and /shop/[category]. Reads runtime params, so render inside <Suspense>. */
export async function ProductListing({
  categorySlug,
  searchParams,
}: {
  categorySlug?: string;
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const sortParam = first(sp.sort) as SortOption | undefined;
  const sort: SortOption = sortParam && SORTS.includes(sortParam) ? sortParam : "featured";
  const page = Math.max(1, Number(first(sp.page)) || 1);
  // "new" = new arrivals, "sale" = marked-down pieces (from the navigation links)
  const filter = first(sp.filter);
  const onlyNew = filter === "new";
  const onlySale = filter === "sale";
  const keepFilter = onlyNew || onlySale ? filter : undefined;
  const selection = parseSelection(sp);
  const filterCount = selectionCount(selection);

  const [category, filters, list] = await Promise.all([
    categorySlug ? getCategory(categorySlug) : Promise.resolve(null),
    getProductFilters({ category: categorySlug, isNew: onlyNew || undefined, sale: onlySale || undefined }),
    getProducts({
      category: categorySlug,
      isNew: onlyNew || undefined,
      sale: onlySale || undefined,
      type: selection.type,
      occasion: selection.occasion,
      color: selection.color,
      fabric: selection.fabric,
      price: priceBandsInPaise(selection.price),
      sort,
      page,
      pageSize: 12,
    }),
  ]);

  if (categorySlug && !category) notFound();

  const path = categorySlug ? `/shop/${categorySlug}` : "/shop";
  const pageHref = (p: number) => listingHref(path, selection, { filter: keepFilter, sort, page: p });

  // A page past the end (old link, edited URL) goes to the last real page.
  if (page > list.totalPages) redirect(pageHref(list.totalPages));

  const title = category?.name ?? (onlyNew ? "New arrivals" : onlySale ? "On sale" : "All pieces");

  return (
    <>
      {/* Slim title row: breadcrumb, title with count, sort */}
      <header className="container-x pt-6 md:pt-8">
        <nav aria-label="Breadcrumb" className="eyebrow flex items-center gap-2 text-[0.625rem] text-stone">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span aria-hidden>/</span>
          {category ? (
            <>
              <Link href="/shop" className="hover:text-ink">Shop</Link>
              <span aria-hidden>/</span>
              <span className="text-ink">{category.name}</span>
            </>
          ) : (
            <span className="text-ink">Shop</span>
          )}
        </nav>
        <div className="mt-3 flex items-end justify-between gap-4">
          <h1 className="display text-[2.25rem] leading-none md:text-[2.75rem]">
            {title}
            {/* Phones/tablets show the count in the filter bar instead */}
            <span className="ml-3 hidden align-middle font-sans text-sm tracking-normal text-stone tabular-nums lg:inline">
              {list.total} {list.total === 1 ? "piece" : "pieces"}
            </span>
          </h1>
          <div className="hidden shrink-0 md:block">
            <SortSelect value={sort} />
          </div>
        </div>
      </header>

      {/* Phones and tablets: Filter button opening a sheet with the same filters */}
      <div className="sticky top-[8.0625rem] z-30 mt-4 border-y border-line bg-canvas/95 backdrop-blur-md md:top-[4.5rem] lg:hidden">
        <div className="container-x py-2.5">
          <FilterSheet filters={filters} selection={selection} filter={keepFilter} sort={sort} total={list.total} />
        </div>
      </div>

      <div className="container-x pb-24 pt-6 md:pb-32 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12 lg:pt-8">
        {/* Desktop: filters down the left */}
        <aside className="hidden lg:block" aria-label="Filters">
          {/* Soft sand panel; scrolls inside if taller than the screen, with no visible scrollbar
              (a hover-only scrollbar would push the icons and counts sideways) */}
          <div className="sticky top-24 max-h-[calc(100svh-7rem)] overflow-y-auto overscroll-contain rounded-xl bg-sand px-5 pb-3 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ShopSidebar filters={filters} selection={selection} filter={keepFilter} sort={sort} />
          </div>
        </aside>

        <section aria-label="Products" className="min-w-0">
          {list.items.length === 0 ? (
            <div className="border border-dashed border-line px-6 py-20 text-center">
              <p className="display text-3xl">{filterCount > 0 ? "No pieces match these filters" : "Nothing here just yet"}</p>
              <p className="mt-3 text-sm text-stone">
                {filterCount > 0 ? "Try removing a filter or two." : "New pieces arrive every week."}
              </p>
              <Link
                href={filterCount > 0 ? listingHref(path, EMPTY_SELECTION, { filter: keepFilter, sort }) : "/shop"}
                className="eyebrow link-draw mt-8 inline-block pb-1"
              >
                {filterCount > 0 ? "Clear filters" : "Browse all pieces"}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6">
              {list.items.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 3} sizes="(min-width: 1024px) 28vw, (min-width: 768px) 33vw, 50vw" />
              ))}
            </div>
          )}

          {list.totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-8">
              {page > 1 ? (
                <Link href={pageHref(page - 1)} aria-label="Previous page" className="inline-flex size-11 items-center justify-center rounded-full border border-line hover:border-ink">
                  <ArrowLeft className="size-4" strokeWidth={1.5} />
                </Link>
              ) : (
                <span className="size-11" />
              )}
              <span className="eyebrow tabular-nums text-stone">
                {page} / {list.totalPages}
              </span>
              {page < list.totalPages ? (
                <Link href={pageHref(page + 1)} aria-label="Next page" className="inline-flex size-11 items-center justify-center rounded-full border border-line hover:border-ink">
                  <ArrowRight className="size-4" strokeWidth={1.5} />
                </Link>
              ) : (
                <span className="size-11" />
              )}
            </nav>
          )}
        </section>
      </div>
    </>
  );
}

export function ProductListingSkeleton() {
  return (
    <div aria-busy>
      <div className="container-x pt-6 md:pt-8">
        <div className="h-2.5 w-28 animate-pulse bg-sand" />
        <div className="mt-4 h-10 w-56 animate-pulse bg-sand" />
      </div>
      <div className="container-x pt-8 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-24 animate-pulse bg-sand" />
          ))}
        </div>
        <ProductGridSkeleton count={6} />
      </div>
    </div>
  );
}
