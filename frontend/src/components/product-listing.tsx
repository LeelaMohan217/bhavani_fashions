import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getCategories, getCategory, getProducts } from "@/lib/api";
import type { SortOption } from "@/lib/types";
import { ProductCard } from "./product-card";
import { SortSelect } from "./sort-select";
import { FilterSheet } from "./filter-sheet";
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
  // "new" = new arrivals, "sale" = marked-down pieces (only on the all-products listing)
  const filter = first(sp.filter);
  const onlyNew = filter === "new";
  const onlySale = filter === "sale";

  const [category, categories, list] = await Promise.all([
    categorySlug ? getCategory(categorySlug) : Promise.resolve(null),
    getCategories(),
    getProducts({ category: categorySlug, isNew: onlyNew || undefined, sale: onlySale || undefined, sort, page, pageSize: 12 }),
  ]);

  if (categorySlug && !category) notFound();

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (onlyNew) params.set("filter", "new");
    if (onlySale) params.set("filter", "sale");
    if (sort !== "featured") params.set("sort", sort);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `${categorySlug ? `/shop/${categorySlug}` : "/shop"}${qs ? `?${qs}` : ""}`;
  };

  // A page past the end (old link, edited URL) goes to the last real page.
  if (page > list.totalPages) redirect(pageHref(list.totalPages));

  const title = category?.name ?? (onlyNew ? "New arrivals" : onlySale ? "On sale" : "All pieces");
  const intro =
    category?.description ??
    (onlyNew
      ? "The latest weaves and silhouettes, fresh from our artisans."
      : onlySale
        ? "Marked-down sarees, lehengas and kurta sets, while stocks last."
        : "Every saree, lehenga and kurta set in the Bhavani collection.");

  return (
    <>
      <header className="container-x pb-10 pt-10 md:pb-14 md:pt-16">
        <nav aria-label="Breadcrumb" className="eyebrow flex items-center gap-2 text-stone">
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

        <div className="mt-8 grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            {category?.tagline && <p className="eyebrow text-clay">{category.tagline}</p>}
            <h1 className="display mt-3 text-[3.25rem] md:text-[5.5rem]">{title}</h1>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-stone md:col-span-4 md:col-start-9">{intro}</p>
        </div>
      </header>

      <div className="sticky top-[4.5rem] z-30 border-y border-line bg-canvas/90 backdrop-blur-md md:top-20">
        <div className="container-x flex items-center justify-between gap-4 py-2.5 md:py-2">
          {/* Phone: one Filter button that opens a sheet. Tablet/desktop: inline chips + sort. */}
          <FilterSheet
            categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
            categorySlug={categorySlug}
            onlyNew={onlyNew}
            onlySale={onlySale}
            sort={sort}
            total={list.total}
          />
          <ul className="-mx-1 hidden gap-1 overflow-x-auto [scrollbar-width:none] md:flex">
            <FilterChip href="/shop" active={!categorySlug && !onlyNew && !onlySale}>All</FilterChip>
            {categories.map((c) => (
              <FilterChip key={c.slug} href={`/shop/${c.slug}`} active={c.slug === categorySlug}>
                {c.name}
              </FilterChip>
            ))}
            <FilterChip href="/shop?filter=new" active={!categorySlug && onlyNew}>New in</FilterChip>
            <FilterChip href="/shop?filter=sale" active={!categorySlug && onlySale}>Sale</FilterChip>
          </ul>
          <div className="hidden md:block">
            <SortSelect value={sort} />
          </div>
        </div>
      </div>

      <section className="container-x pb-24 pt-10 md:pb-32 md:pt-12">
        <p className="eyebrow mb-8 hidden text-stone md:block">
          {list.total} {list.total === 1 ? "piece" : "pieces"}
        </p>

        {list.items.length === 0 ? (
          <div className="border border-dashed border-line py-24 text-center">
            <p className="display text-3xl">Nothing here just yet</p>
            <p className="mt-3 text-sm text-stone">New pieces arrive every week.</p>
            <Link href="/shop" className="eyebrow link-draw mt-8 inline-block pb-1">Browse all pieces</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-14 md:gap-x-6 lg:grid-cols-4">
            {list.items.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        )}

        {list.totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-20 flex items-center justify-center gap-8">
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
    </>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`eyebrow inline-block whitespace-nowrap rounded-full px-4 py-2 text-[0.625rem] transition-colors ${
          active ? "bg-ink text-canvas" : "text-ink-soft hover:bg-sand"
        }`}
      >
        {children}
      </Link>
    </li>
  );
}

export function ProductListingSkeleton() {
  return (
    <div aria-busy>
      <div className="container-x pb-14 pt-16">
        <div className="h-3 w-32 animate-pulse bg-sand" />
        <div className="mt-10 h-20 w-2/3 animate-pulse bg-sand md:w-1/3" />
      </div>
      <div className="h-14 border-y border-line" />
      <div className="container-x pt-20">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
