"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronRight, GalleryHorizontalEnd, Plus, TriangleAlert } from "lucide-react";
import { reorderBanners, setBannerActive } from "@/lib/admin/actions";
import type { AdminBanner } from "@/lib/admin/types";
import { Badge, Card, EmptyState, btn, rowAction } from "./ui";

/** Banners in slideshow order, with reorder and show/hide. Changes save straight away. */
export function BannerList({ banners: initial }: { banners: AdminBanner[] }) {
  const router = useRouter();
  const [banners, setBanners] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const live = banners.filter((b) => b.isActive).length;

  const move = (from: number, to: number) => {
    const next = [...banners];
    const [b] = next.splice(from, 1);
    next.splice(to, 0, b);
    const before = banners;
    setBanners(next); // show the new order at once; undo if saving fails
    setError(null);
    start(async () => {
      const res = await reorderBanners(next.map((x) => x.id));
      if (!res.ok) {
        setBanners(before);
        setError(res.error);
      } else router.refresh();
    });
  };

  const toggle = (id: string, isActive: boolean) => {
    const before = banners;
    setBanners((list) => list.map((b) => (b.id === id ? { ...b, isActive } : b)));
    setError(null);
    start(async () => {
      const res = await setBannerActive(id, isActive);
      if (!res.ok) {
        setBanners(before);
        setError(res.error);
      } else router.refresh();
    });
  };

  if (banners.length === 0) {
    return (
      <Card bodyClassName="">
        <EmptyState
          icon={GalleryHorizontalEnd}
          title="No banners yet"
          description="Banners are the big offer pictures at the top of your home page. Add one to get started."
          action={
            <Link href="/admin/banners/new" className={`${btn.base} ${btn.primary}`}>
              <Plus className="size-4" /> Add banner
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" /> {error}
        </div>
      )}
      {live === 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" /> No banner is showing, so the home page starts straight with categories. Turn one on below.
        </div>
      )}

      <Card bodyClassName="" title={<span>Slideshow order <span className="font-normal text-neutral-500">· {live} showing</span></span>}>
        <ol className={`divide-y divide-neutral-100 ${pending ? "opacity-70" : ""}`}>
          {banners.map((b, i) => (
            <li key={b.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:flex-nowrap sm:gap-4 sm:px-5">
              <span className="hidden w-5 shrink-0 text-center text-sm tabular-nums text-neutral-400 sm:block">{i + 1}</span>

              <Link href={`/admin/banners/${b.id}`} className="group flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                <span className={`relative aspect-[21/9] w-24 shrink-0 overflow-hidden rounded-md bg-neutral-100 sm:w-36 ${b.isActive ? "" : "opacity-50 grayscale"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail */}
                  <img src={b.imageUrl} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm font-medium group-hover:underline sm:line-clamp-1">
                    {b.title}
                    {b.highlight && <em className="italic"> {b.highlight}</em>}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-neutral-500">
                    {b.ctaLabel} → <span className="font-mono">{b.ctaHref}</span>
                  </span>
                </span>
              </Link>

              <span className="hidden sm:block">{b.isActive ? <Badge tone="green" dot>Showing</Badge> : <Badge dot>Hidden</Badge>}</span>

              {/* Phones: controls on their own line so the banner name has room */}
              <div className="flex w-full shrink-0 items-center justify-end gap-0.5 border-t border-neutral-100 pt-2 sm:w-auto sm:border-0 sm:pt-0">
                <span className="mr-auto sm:hidden">{b.isActive ? <Badge tone="green" dot>Showing</Badge> : <Badge dot>Hidden</Badge>}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={b.isActive}
                  aria-label={b.isActive ? `Hide “${b.title}” from the home page` : `Show “${b.title}” on the home page`}
                  title={b.isActive ? "Hide" : "Show"}
                  disabled={pending}
                  onClick={() => toggle(b.id, !b.isActive)}
                  className="mr-1 inline-flex h-8 items-center px-1"
                >
                  <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${b.isActive ? "bg-neutral-900" : "bg-neutral-200"}`}>
                    <span className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${b.isActive ? "translate-x-[1.125rem]" : "translate-x-0.5"}`} />
                  </span>
                </button>
                <button type="button" disabled={pending || i === 0} onClick={() => move(i, i - 1)} aria-label={`Move “${b.title}” earlier`} className={rowAction}>
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={pending || i === banners.length - 1}
                  onClick={() => move(i, i + 1)}
                  aria-label={`Move “${b.title}” later`}
                  className={rowAction}
                >
                  <ArrowDown className="size-4" />
                </button>
                <Link href={`/admin/banners/${b.id}`} aria-label={`Edit “${b.title}”`} className={`${rowAction} hidden sm:inline-flex`}>
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </Card>
      <p className="px-1 text-xs text-neutral-500">The home page shows banners in this order and moves to the next one every 6 seconds.</p>
    </div>
  );
}
