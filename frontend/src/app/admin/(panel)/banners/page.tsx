import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { getBanners, getPromotion } from "@/lib/admin/api";
import { Card, PageHeader, TableSkeleton, btn } from "@/components/admin/ui";
import { BannerList } from "@/components/admin/banner-list";
import { PromotionCard } from "@/components/admin/promotion-card";

export const metadata: Metadata = { title: "Banners" };

export default function BannersPage() {
  return (
    <>
      <PageHeader
        title="Banners & offers"
        description="The offer pictures at the top of your home page, and store-wide sales like Black Friday."
        actions={
          <>
            <Link href="/" target="_blank" className={`${btn.base} ${btn.secondary}`}>
              <ExternalLink className="size-4" /> View home page
            </Link>
            <Link href="/admin/banners/new" className={`${btn.base} ${btn.primary}`}>
              <Plus className="size-4" /> Add banner
            </Link>
          </>
        }
      />
      <Suspense
        fallback={
          <Card bodyClassName="">
            <TableSkeleton rows={3} />
          </Card>
        }
      >
        <List />
      </Suspense>
    </>
  );
}

async function List() {
  const [banners, promotion] = await Promise.all([getBanners(), getPromotion()]);
  return (
    <div className="space-y-6">
      <PromotionCard promotion={promotion} />
      <BannerList banners={banners} />
    </div>
  );
}
