// GET /admin/products/export — CSV of the products matching the current filters.
import { getProducts } from "@/lib/admin/api";
import { csvResponse, fetchAll, stamp, toCsv } from "@/lib/admin/csv";

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const query = {
    status: sp.get("status") ?? undefined,
    search: sp.get("search") ?? undefined,
    category: sp.get("category") ?? undefined,
  };

  const products = await fetchAll((page) => getProducts({ ...query, page, pageSize: 100 }));

  const csv = toCsv(
    ["Product", "Slug", "Category", "Price (₹)", "Compare-at (₹)", "Variants", "Stock", "Status", "Featured", "Updated"],
    products.map((p) => [
      p.name,
      p.slug,
      p.category,
      (p.price / 100).toFixed(2),
      p.compareAtPrice ? (p.compareAtPrice / 100).toFixed(2) : "",
      p.variantCount,
      p.totalStock,
      p.isActive ? "Live" : "Hidden",
      p.isFeatured ? "Yes" : "No",
      new Date(p.updatedAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
    ]),
  );

  return csvResponse(`bhavani-products-${stamp()}.csv`, csv);
}
