import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getMe } from "@/lib/admin/api";
import { Card, PageHeader, TableSkeleton } from "@/components/admin/ui";
import { ProfileForm } from "@/components/admin/profile-form";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Profile" description="Your name, sign-in email and password." />
      <Suspense
        fallback={
          <Card bodyClassName="">
            <TableSkeleton rows={3} />
          </Card>
        }
      >
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  await connection();
  const me = await getMe();
  return <ProfileForm key={`${me.name}|${me.email}`} admin={me} />;
}
