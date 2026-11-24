import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { ADMIN_COOKIE, API_URL } from "@/lib/admin/api";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-3xl tracking-tight">Kosha</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">Store admin</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-lg font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-neutral-500">Use your staff account to manage the store.</p>
          <Suspense>
            <LoginWithNext searchParams={searchParams} />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-neutral-500">Forgot your password? Ask the store owner to reset it.</p>
      </div>
    </div>
  );
}

async function LoginWithNext({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  // Already signed in? Skip the form.
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (token) {
    const res = await fetch(`${API_URL}/api/admin/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => null);
    if (res?.ok) redirect("/admin");
  }

  const next = (await searchParams).next;
  return <LoginForm next={typeof next === "string" ? next : undefined} />;
}
