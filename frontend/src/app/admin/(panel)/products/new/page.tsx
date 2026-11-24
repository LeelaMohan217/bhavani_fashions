import { Suspense } from "react";
import type { Metadata } from "next";
import { getCategories } from "@/lib/admin/api";
import { PageHeader } from "@/components/admin/ui";
import { ProductEditor } from "@/components/admin/product-editor";
import { ProductEditorSkeleton } from "@/components/admin/skeletons";

export const metadata: Metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: "Products" }} title="New product" />
      <Suspense fallback={<ProductEditorSkeleton />}>
        <Editor />
      </Suspense>
    </>
  );
}

async function Editor() {
  const categories = await getCategories();
  return <ProductEditor categories={categories} />;
}
