import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getCategory } from "@/lib/admin/api";
import { Badge, Card, PageHeader, TableSkeleton } from "@/components/admin/ui";
import { CategoryEditor } from "@/components/admin/category-editor";

export const metadata: Metadata = { title: "Edit category" };

export default function EditCategoryPage({ params }: PageProps<"/admin/categories/[id]">) {
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
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: Pick<PageProps<"/admin/categories/[id]">, "params">) {
  const { id } = await params;
  const [category, all] = await Promise.all([getCategory(id), getCategories()]);
  if (!category) notFound();

  return (
    <>
      <PageHeader
        back={{ href: "/admin/categories", label: "Categories" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {category.parent && <span className="font-normal text-neutral-400">{category.parent.name} /</span>}
            {category.name}
            {category.isActive ? <Badge tone="green" dot>Showing</Badge> : <Badge dot>Hidden</Badge>}
          </span>
        }
        description={`${category.productCount} product${category.productCount === 1 ? "" : "s"}${
          category.childCount ? ` · ${category.childCount} subcategor${category.childCount === 1 ? "y" : "ies"}` : ""
        }`}
      />
      <CategoryEditor key={category.id} category={category} all={all} />
    </>
  );
}
