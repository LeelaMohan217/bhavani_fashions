import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Not found" };

// Catches unknown /admin/* URLs so they get the admin 404 (inside the admin shell)
// instead of falling through to the storefront's not-found page.
export default function MissingAdminPage() {
  notFound();
}
