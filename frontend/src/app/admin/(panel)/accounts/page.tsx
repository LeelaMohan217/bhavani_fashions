import { Suspense } from "react";
import type { Metadata } from "next";
import { getAccounts } from "@/lib/admin/api";
import { Card, PageHeader, TableSkeleton } from "@/components/admin/ui";
import { AccountsList } from "@/components/admin/accounts-list";

export const metadata: Metadata = { title: "Admin Accounts" };

export default function AccountsPage() {
  return (
    <>
      <PageHeader title="Admin Accounts" description="People who can sign in to this admin panel." />
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
  const accounts = await getAccounts();
  // The list updates its own copy after each action (and keeps its confirmation message)
  return <AccountsList accounts={accounts} />;
}
