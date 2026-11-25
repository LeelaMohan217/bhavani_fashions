import { connection } from "next/server";
import { getNavigation } from "./api";
import type { NavNode } from "./types";

export type { NavNode };

/**
 * The header or footer menu from Admin → Navigation. Until one is saved, the header follows the
 * categories (subcategories become its dropdown) and the footer shows Shop, Help and Kosha.
 * Empty if the API can't be reached.
 */
export async function getMenu(menu: "header" | "footer"): Promise<NavNode[]> {
  // Read at request time, never during the build, so deploys don't depend on the API
  await connection();
  return (await getNavigation(menu).catch(() => null))?.items ?? [];
}
