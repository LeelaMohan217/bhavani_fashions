import { Suspense } from "react";
import type { Metadata } from "next";
import { getCategories } from "@/lib/admin/api";
import { Card, PageHeader, TableSkeleton } from "@/components/admin/ui";
import { CategoryEditor } from "@/components/admin/category-editor";

export const metadata: Metadata = { title: "New category" };

export default function NewCategoryPage({ searchParams }: PageProps<"/admin/categories/new">) {
  return (
    <Suspense
      fallback={
        <>
          <div className="mb-6 h-14" aria-hidden />
          <Card bodyClassName="">
            <TableSkeleton rows={4} />
          </Card>
        </>
      }
    >
      <Editor searchParams={searchParams} />
    </Suspense>
  );
}

async function Editor({ searchParams }: Pick<PageProps<"/admin/categories/new">, "searchParams">) {
  const sp = await searchParams;
  const all = await getCategories();
  // "Add subcategory to Sarees" links pass ?parent=<id>
  const parentParam = Array.isArray(sp.parent) ? sp.parent[0] : sp.parent;
  const parent = all.find((c) => c.id === parentParam && !c.parentId);

  return (
    <>
      <PageHeader
        back={{ href: "/admin/categories", label: "Categories" }}
        title={parent ? `New subcategory in ${parent.name}` : "New category"}
      />
      <CategoryEditor all={all} defaultParentId={parent?.id ?? null} />
    </>
  );
}
