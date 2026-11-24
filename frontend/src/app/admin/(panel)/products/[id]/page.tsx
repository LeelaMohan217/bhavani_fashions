import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getCategories, getProduct } from "@/lib/admin/api";
import { Badge, PageHeader, btn } from "@/components/admin/ui";
import { ProductEditor } from "@/components/admin/product-editor";
import { ProductEditorSkeleton } from "@/components/admin/skeletons";

export const metadata: Metadata = { title: "Edit product" };

export default function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<><div className="mb-6 h-14" aria-hidden /><ProductEditorSkeleton /></>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: Pick<PageProps<"/admin/products/[id]">, "params">) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getProduct(id), getCategories()]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        back={{ href: "/admin/products", label: "Products" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {product.name}
            {product.isActive ? <Badge tone="green" dot>Live</Badge> : <Badge dot>Hidden</Badge>}
          </span>
        }
        actions={
          product.isActive && (
            <Link href={`/products/${product.slug}`} target="_blank" className={`${btn.base} ${btn.secondary}`}>
              <ExternalLink className="size-4" /> View in store
            </Link>
          )
        }
      />
      <ProductEditor key={product.id} product={product} categories={categories} />
    </>
  );
}
