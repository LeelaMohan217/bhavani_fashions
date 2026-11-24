import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductListing, ProductListingSkeleton } from "@/components/product-listing";

export const metadata: Metadata = {
  title: "Shop all",
  description: "Shop handpicked sarees, lehengas and kurta sets from Bhavani Fashion.",
};

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <Suspense fallback={<ProductListingSkeleton />}>
      <ProductListing searchParams={searchParams} />
    </Suspense>
  );
}
