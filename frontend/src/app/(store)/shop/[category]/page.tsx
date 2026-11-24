import { Suspense } from "react";
import type { Metadata } from "next";
import { getCategory } from "@/lib/api";
import { ProductListing, ProductListingSkeleton } from "@/components/product-listing";

export async function generateMetadata({ params }: PageProps<"/shop/[category]">): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Not found" };
  return { title: category.name, description: category.description ?? undefined };
}

export default function CategoryPage({ params, searchParams }: PageProps<"/shop/[category]">) {
  return (
    <Suspense fallback={<ProductListingSkeleton />}>
      <CategoryListing params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CategoryListing({
  params,
  searchParams,
}: Pick<PageProps<"/shop/[category]">, "params" | "searchParams">) {
  const { category } = await params;
  return <ProductListing categorySlug={category} searchParams={searchParams} />;
}
