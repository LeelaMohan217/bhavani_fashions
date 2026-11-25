import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCoupon } from "@/lib/admin/api";
import { Card, PageHeader, TableSkeleton } from "@/components/admin/ui";
import { CouponEditor } from "@/components/admin/coupon-editor";

export const metadata: Metadata = { title: "Edit code" };

export default function EditCouponPage({ params }: PageProps<"/admin/coupons/[id]">) {
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

async function Editor({ params }: Pick<PageProps<"/admin/coupons/[id]">, "params">) {
  const { id } = await params;
  const coupon = await getCoupon(id);
  if (!coupon) notFound();
  return (
    <>
      <PageHeader
        back={{ href: "/admin/coupons", label: "Coupons" }}
        title={<span className="tracking-wide">{coupon.code}</span>}
        description={`${coupon.label} · used ${coupon.usedCount}${coupon.usageLimit ? ` of ${coupon.usageLimit}` : ""} time${coupon.usedCount === 1 && !coupon.usageLimit ? "" : "s"}`}
      />
      <CouponEditor key={coupon.id} coupon={coupon} />
    </>
  );
}