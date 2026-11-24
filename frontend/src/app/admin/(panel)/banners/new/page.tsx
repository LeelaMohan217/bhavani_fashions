import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { BannerEditor } from "@/components/admin/banner-editor";

export const metadata: Metadata = { title: "New banner" };

export default function NewBannerPage() {
  return (
    <>
      <PageHeader back={{ href: "/admin/banners", label: "Banners" }} title="New banner" />
      <BannerEditor />
    </>
  );
}
