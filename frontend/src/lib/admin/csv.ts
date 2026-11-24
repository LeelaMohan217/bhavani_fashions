/** Builds an RFC 4180 CSV string (with a BOM so Excel opens ₹ and Indian names correctly). */
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const cell = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    // Neutralise spreadsheet formula injection, then quote if needed
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return "﻿" + [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}

export function csvResponse(filename: string, body: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Fetches every page of a paginated admin list (100 per request). */
export async function fetchAll<T>(
  fetchPage: (page: number) => Promise<{ items: T[]; totalPages: number }>,
  maxPages = 50,
): Promise<T[]> {
  const first = await fetchPage(1);
  const rest = await Promise.all(
    Array.from({ length: Math.min(first.totalPages, maxPages) - 1 }, (_, i) => fetchPage(i + 2)),
  );
  return [first, ...rest].flatMap((p) => p.items);
}

export const stamp = () => new Date().toISOString().slice(0, 10);
