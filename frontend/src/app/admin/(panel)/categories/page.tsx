import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { getCategories } from "@/lib/admin/api";
import { Card, PageHeader, TableSkeleton, btn } from "@/components/admin/ui";
import { CategoryList } from "@/components/admin/category-list";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <>
      <PageHeader
        title="Categories"
        description="Group your products into categories and subcategories, like Sarees → Silk sarees."
        actions={
          <>
            <Link href="/shop" target="_blank" className={`${btn.base} ${btn.secondary}`}>
              <ExternalLink className="size-4" /> View shop
            </Link>
            <Link href="/admin/categories/new" className={`${btn.base} ${btn.primary}`}>
              <Plus className="size-4" /> Add category
            </Link>
          </>
        }
      />
      <Suspense
        fallback={
          <Card bodyClassName="">
            <TableSkeleton rows={4} />
          </Card>
        }
      >
        <List />
      </Suspense>
    </>
  );
}

async function List() {
  const categories = await getCategories();
  // The list keeps its own copy for instant reorder/show-hide; a new key resets it whenever
  // the server sends a different set (e.g. after adding or editing a category).
  const version = categories
    .map((c) => `${c.id}:${c.name}:${c.parentId}:${c.isActive}:${c.sortOrder}:${c.productCount}:${c.imageUrl}`)
    .join("|");
  return <CategoryList key={version} categories={categories} />;
}
