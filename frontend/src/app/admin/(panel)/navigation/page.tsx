import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getCategories, getNavigation } from "@/lib/admin/api";
import type { NavMenuKey } from "@/lib/admin/types";
import { Card, PageHeader, TableSkeleton, btn } from "@/components/admin/ui";
import { NavEditor } from "@/components/admin/nav-editor";

export const metadata: Metadata = { title: "Navigation" };

const MENUS: { value: NavMenuKey; label: string }[] = [
  { value: "header", label: "Header" },
  { value: "footer", label: "Footer" },
];

export default function NavigationPage({ searchParams }: PageProps<"/admin/navigation">) {
  return (
    <>
      <PageHeader
        title="Navigation"
        description="The links in your store's header (and the phone menu) and footer."
        actions={
          <Link href="/" target="_blank" className={`${btn.base} ${btn.secondary}`}>
            <ExternalLink className="size-4" /> View store
          </Link>
        }
      />
      <Suspense
        fallback={
          <Card bodyClassName="">
            <TableSkeleton rows={4} />
          </Card>
        }
      >
        <Editor searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Editor({ searchParams }: Pick<PageProps<"/admin/navigation">, "searchParams">) {
  const sp = await searchParams;
  const menu: NavMenuKey = sp.menu === "footer" ? "footer" : "header";
  const [nav, categories] = await Promise.all([getNavigation(menu), getCategories()]);
  const chip = (active: boolean) =>
    `rounded px-3 py-1 text-sm transition-colors ${active ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-500 hover:text-neutral-900"}`;

  return (
    <div className="space-y-3">
      <nav aria-label="Menu" className="inline-flex rounded-md bg-neutral-100 p-0.5">
        {MENUS.map((m) => (
          <Link
            key={m.value}
            href={m.value === "header" ? "/admin/navigation" : "/admin/navigation?menu=footer"}
            aria-current={menu === m.value ? "page" : undefined}
            className={chip(menu === m.value)}
          >
            {m.label}
          </Link>
        ))}
      </nav>
      <NavEditor key={menu} menu={menu} initial={nav.items} custom={nav.custom} categories={categories} />
    </div>
  );
}
