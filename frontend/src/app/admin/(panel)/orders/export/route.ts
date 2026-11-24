// GET /admin/orders/export — CSV of the orders matching the current filters.
import { getOrders } from "@/lib/admin/api";
import { csvResponse, fetchAll, stamp, toCsv } from "@/lib/admin/csv";

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const query = {
    status: sp.get("status") ?? undefined,
    search: sp.get("search") ?? undefined,
    payment: sp.get("payment") ?? undefined,
  };

  const orders = await fetchAll((page) => getOrders({ ...query, page, pageSize: 100 }));

  const csv = toCsv(
    ["Order", "Placed", "Customer", "Phone", "City", "Pieces", "Payment method", "Payment status", "Status", "Total (₹)"],
    orders.map((o) => [
      o.number,
      new Date(o.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      o.fullName,
      o.phone,
      o.city,
      o.pieces,
      o.paymentMethod === "COD" ? "Cash on delivery" : "Razorpay",
      o.paymentStatus,
      o.status,
      (o.total / 100).toFixed(2),
    ]),
  );

  return csvResponse(`bhavani-orders-${stamp()}.csv`, csv);
}
