import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { getBanners } from "@/lib/admin/api";
import { Card, PageHeader, TableSkeleton, btn } from "@/components/admin/ui";
import { BannerList } from "@/components/admin/banner-list";

export const metadata: Metadata = { title: "Banners" };

export default function BannersPage() {
  return (
    <>
      <PageHeader
        title="Banners"
        description="The offer pictures at the top of your home page."
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
  const banners = await getBanners();
  return <BannerList banners={banners} />;
}
