import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, History } from "lucide-react";
import { getActivity } from "@/lib/admin/api";
import { ACTIVITY_AREAS, type ActivityArea, type ActivityList } from "@/lib/admin/types";
import { Avatar, Card, EmptyState, PageHeader, Pagination, TableSkeleton } from "@/components/admin/ui";
import { FilterMenu } from "@/components/admin/filter-menu";

export const metadata: Metadata = { title: "Activity log" };

const PAGE_SIZE = 30;
const AREA_LABEL: Record<ActivityArea, string> = {
  order: "Orders",
  product: "Products",
  category: "Categories",
  banner: "Banners",
  coupon: "Coupons",
  offer: "Store offer",
  account: "Admin accounts",
  profile: "Profile",
};
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const TZ = "Asia/Kolkata";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const dayLabel = new Intl.DateTimeFormat("en-IN", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", year: "numeric" });
const timeLabel = new Intl.DateTimeFormat("en-IN", { timeZone: TZ, hour: "numeric", minute: "2-digit" });

export default function ActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  return (
    <>
      <PageHeader title="Activity log" description="Every change made in the admin panel, newest first." />
      <Suspense
        fallback={
          <Card bodyClassName="">
            <TableSkeleton rows={8} />
          </Card>
        }
      >
        <Log searchParams={searchParams} />
      </Suspense>
    </>
  );
}

/** "Today", "Yesterday" or the date, in Indian time */
function dayHeading(key: string) {
  const today = dayKey.format(new Date());
  const yesterday = dayKey.format(new Date(Date.now() - 86_400_000));
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return dayLabel.format(new Date(`${key}T12:00:00+05:30`));
}

function byDay(items: ActivityList["items"]) {
  const groups: { key: string; items: ActivityList["items"] }[] = [];
  for (const it of items) {
    const key = dayKey.format(new Date(it.createdAt));
    const last = groups.at(-1);
    if (last?.key === key) last.items.push(it);
    else groups.push({ key, items: [it] });
  }
  return groups;
}

async function Log({ searchParams }: Pick<PageProps<"/admin/activity">, "searchParams">) {
  const sp = await searchParams;
  const rawArea = first(sp.area);
  const area = (ACTIVITY_AREAS as readonly string[]).includes(rawArea ?? "") ? (rawArea as ActivityArea) : undefined;
  const admin = first(sp.admin) || undefined;
  const page = Math.max(1, Number(first(sp.page)) || 1);
  const data = await getActivity({ area, admin, page, pageSize: PAGE_SIZE });

  const href = (next: Partial<{ area: string | undefined; admin: string | undefined; page: number }>) => {
    const v = { area, admin, page: 1, ...next };
    const q = new URLSearchParams();
    if (v.area) q.set("area", v.area);
    if (v.admin) q.set("admin", v.admin);
    if (v.page > 1) q.set("page", String(v.page));
    return `/admin/activity${q.size ? `?${q}` : ""}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-neutral-500">
          {area || admin ? (
            <>
              Showing {[area && AREA_LABEL[area], admin && data.admins.find((a) => a.id === admin)?.name].filter(Boolean).join(" · ")}
            </>
          ) : (
            "Showing everything"
          )}
        </p>
        <FilterMenu
          activeCount={(area ? 1 : 0) + (admin ? 1 : 0)}
          clearHref={href({ area: undefined, admin: undefined })}
          sections={[
            {
              label: "Area",
              options: [
                { label: "Everything", href: href({ area: undefined }), active: !area },
                ...ACTIVITY_AREAS.map((a) => ({ label: AREA_LABEL[a], href: href({ area: a }), active: area === a })),
              ],
            },
            ...(data.admins.length > 1
              ? [
                  {
                    label: "Admin",
                    options: [
                      { label: "Everyone", href: href({ admin: undefined }), active: !admin },
                      ...data.admins.map((a) => ({ label: a.name, href: href({ admin: a.id }), active: admin === a.id })),
                    ],
                  },
                ]
              : []),
          ]}
        />
      </div>

      <Card bodyClassName="">
        {data.items.length === 0 ? (
          <EmptyState
            icon={History}
            title={area || admin ? "Nothing matches these filters" : "No activity yet"}
            description="Changes to orders, products, categories, banners, coupons and accounts are recorded here."
          />
        ) : (
          byDay(data.items).map((g) => (
            <section key={g.key}>
              <h2 className="border-b border-neutral-100 bg-neutral-50 px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-neutral-500">
                {dayHeading(g.key)}
              </h2>
              <ul className="divide-y divide-neutral-100">
                {g.items.map((it) => {
                  const body = (
                    <>
                      <span className="w-16 shrink-0 text-xs tabular-nums text-neutral-400">{timeLabel.format(new Date(it.createdAt))}</span>
                      <Avatar name={it.adminName} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-neutral-900">{it.summary}</span>
                        <span className="block text-xs text-neutral-500">
                          {it.adminName} · {AREA_LABEL[it.area]}
                        </span>
                      </span>
                      {it.href && <ChevronRight className="size-4 shrink-0 text-neutral-300 transition-colors group-hover:text-neutral-500" />}
                    </>
                  );
                  return (
                    <li key={it.id}>
                      {it.href ? (
                        <Link href={it.href} className="group flex items-center gap-3 px-4 py-2 hover:bg-neutral-50">
                          {body}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-2">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={PAGE_SIZE} href={(p) => href({ page: p })} />
      </Card>
      <p className="px-1 text-xs text-neutral-500">Times follow Indian time. Passwords and other private details are never recorded.</p>
    </div>
  );
}