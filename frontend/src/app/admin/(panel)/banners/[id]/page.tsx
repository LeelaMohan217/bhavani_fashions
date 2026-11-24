import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBanner } from "@/lib/admin/api";
import { Badge, Card, PageHeader, TableSkeleton } from "@/components/admin/ui";
import { BannerEditor } from "@/components/admin/banner-editor";

export const metadata: Metadata = { title: "Edit banner" };

export default function EditBannerPage({ params }: PageProps<"/admin/banners/[id]">) {
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

async function Editor({ params }: Pick<PageProps<"/admin/banners/[id]">, "params">) {
  const { id } = await params;
  const banner = await getBanner(id);
  if (!banner) notFound();

  return (
    <>
      <PageHeader
        back={{ href: "/admin/banners", label: "Banners" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {banner.title}
            {banner.highlight && <em className="font-normal italic">{banner.highlight}</em>}
            {banner.isActive ? <Badge tone="green" dot>Showing</Badge> : <Badge dot>Hidden</Badge>}
          </span>
        }
      />
      <BannerEditor key={banner.id} banner={banner} />
    </>
  );
}
