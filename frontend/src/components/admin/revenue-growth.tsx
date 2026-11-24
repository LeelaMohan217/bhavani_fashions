"use client";

import { useId, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { Card } from "./ui";

type Month = { month: string; orders: number; revenue: number };

const BLUE = "#2a78d6";
const W = 600;
const H = 200;

// en-IN writes September as "Sept"; keep every short month to three letters
const monthName = (key: string, style: "short" | "long") =>
  new Intl.DateTimeFormat("en-IN", { month: style, timeZone: "UTC" })
    .format(new Date(`${key}-01T00:00:00Z`))
    .replace(/^Sept$/, "Sep");

/** Paise → compact rupees for axis labels: ₹1.6L, ₹80k, ₹500 */
function compact(paise: number) {
  const r = paise / 100;
  const trim = (n: number) => (Math.round(n * 10) / 10).toString();
  if (r >= 1e5) return `₹${trim(r / 1e5)}L`;
  if (r >= 1e3) return `₹${trim(r / 1e3)}k`;
  return `₹${Math.round(r)}`;
}

/** Round up to a tidy axis maximum (1, 2, 2.5, 4, 5, 8 × 10ⁿ) */
function niceMax(v: number) {
  if (v <= 0) return 100_000; // ₹1,000 so an empty chart still has an axis
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const step = [1, 2, 2.5, 4, 5, 8, 10].find((s) => s * p >= v) ?? 10;
  return step * p;
}

const pct = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null);

export function Delta({ value, label }: { value: number | null; label?: string }) {
  if (value === null) return null;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${up ? "text-emerald-700" : "text-red-600"}`}>
      {up ? <TrendingUp className="size-3.5" aria-hidden /> : <TrendingDown className="size-3.5" aria-hidden />}
      {up ? "+" : "−"}
      {Math.abs(value)}%{label && <span className="font-normal text-neutral-400">{label}</span>}
    </span>
  );
}

/** Monthly revenue curve with a 6M / 12M switch and a tap/hover tooltip per month. */
export function RevenueGrowth({ monthly, className = "" }: { monthly: Month[]; className?: string }) {
  const [range, setRange] = useState<6 | 12>(12);
  const [active, setActive] = useState<number | null>(null);
  const gradientId = useId();

  const data = monthly.slice(-range);
  const n = data.length;
  const last = n - 1;
  const max = niceMax(Math.max(...data.map((m) => m.revenue)));
  const x = (i: number) => (n === 1 ? W / 2 : (i / last) * W);
  const y = (v: number) => H - (v / max) * H;
  const left = (i: number) => `${(x(i) / W) * 100}%`;
  const top = (v: number) => `${(y(v) / H) * 100}%`;

  const curve = data
    .map((m, i) => {
      if (i === 0) return `M${x(0)},${y(m.revenue)}`;
      const x0 = x(i - 1), y0 = y(data[i - 1].revenue), x1 = x(i), y1 = y(m.revenue), cx = (x0 + x1) / 2;
      return `C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
    })
    .join(" ");
  const area = `${curve} L${x(last)},${H} L${x(0)},${H} Z`;

  const current = data[last];
  const previous = data[last - 1];
  const total = data.reduce((s, m) => s + m.revenue, 0);
  const shown = active ?? null;

  // Nearest month to the pointer
  const pick = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * last);
    setActive(Math.min(last, Math.max(0, i)));
  };

  return (
    <Card
      title="Revenue growth"
      className={`min-w-0 ${className}`}
      action={
        <div role="group" aria-label="Range" className="inline-flex rounded-md bg-neutral-100 p-0.5 text-xs font-medium">
          {([6, 12] as const).map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => {
                setRange(r);
                setActive(null);
              }}
              className={`rounded px-2.5 py-1 transition-colors ${range === r ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-500 hover:text-neutral-900"}`}
            >
              {r}M
            </button>
          ))}
        </div>
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-neutral-500">{monthName(current.month, "long")} so far</p>
          <p className="mt-0.5 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{formatPrice(current.revenue)}</p>
          <div className="mt-1 h-4">
            {previous && <Delta value={pct(current.revenue, previous.revenue)} label={`vs ${monthName(previous.month, "long")}`} />}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-500">Last {range} months</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatPrice(total)}</p>
        </div>
      </div>

      <div className="relative mt-6 flex" aria-hidden>
        <div className="flex h-44 w-11 shrink-0 flex-col justify-between text-[0.65rem] tabular-nums text-neutral-400 sm:h-52">
          {[1, 0.75, 0.5, 0.25, 0].map((f) => (
            <span key={f}>{compact(max * f)}</span>
          ))}
        </div>
        <div
          className="relative h-44 flex-1 touch-pan-y sm:h-52"
          onPointerMove={pick}
          onPointerDown={pick}
          onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
        >
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={BLUE} stopOpacity="0.28" />
                <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((f) => (
              <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="#e5e5e5" strokeDasharray={f === 1 ? undefined : "3 4"} vectorEffect="non-scaling-stroke" />
            ))}
            <path d={area} fill={`url(#${gradientId})`} className="animate-[fade-in_0.6s_ease-out_both]" />
            <path
              d={curve}
              fill="none"
              stroke={BLUE}
              strokeWidth="2.25"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {shown !== null && <line x1={x(shown)} x2={x(shown)} y1="0" y2={H} stroke="#a3a3a3" vectorEffect="non-scaling-stroke" />}
          </svg>

          {data.map((m, i) => (
            <span
              key={m.month}
              className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white transition-[width,height] ${
                i === shown || (shown === null && i === last) ? "size-3 shadow" : "size-2"
              }`}
              style={{ left: left(i), top: top(m.revenue), background: BLUE }}
            />
          ))}

          {shown !== null && (
            <div
              className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-lg"
              style={{
                left: left(shown),
                top: `calc(${top(data[shown].revenue)} - 12px)`,
                // keep the tooltip inside the chart at both ends
                transform: `translate(${shown === 0 ? "0" : shown === last ? "-100%" : "-50%"}, -100%)`,
              }}
            >
              <p className="font-medium text-neutral-900">{monthName(data[shown].month, "long")}</p>
              <p className="mt-0.5 tabular-nums text-neutral-700">
                {formatPrice(data[shown].revenue)} · {data[shown].orders} {data[shown].orders === 1 ? "order" : "orders"}
              </p>
              {shown > 0 && <Delta value={pct(data[shown].revenue, data[shown - 1].revenue)} label={`vs ${monthName(data[shown - 1].month, "short")}`} />}
            </div>
          )}
        </div>
      </div>
      {/* Month labels sit exactly under their points */}
      <div aria-hidden className="relative ml-11 mt-2 h-4 text-[0.6rem] text-neutral-400 sm:text-[0.65rem]">
        {data.map((m, i) => (
          <span
            key={m.month}
            className={`absolute whitespace-nowrap ${i === 0 ? "" : i === last ? "-translate-x-full" : "-translate-x-1/2"} ${
              i === last ? "font-semibold text-neutral-700" : range === 12 && (last - i) % 2 ? "max-sm:hidden" : ""
            }`}
            style={{ left: left(i) }}
          >
            {monthName(m.month, "short")}
          </span>
        ))}
      </div>

      {/* Same numbers for screen readers */}
      <table className="sr-only">
        <caption>Revenue by month</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Revenue</th>
            <th>Orders</th>
          </tr>
        </thead>
        <tbody>
          {data.map((m) => (
            <tr key={m.month}>
              <td>{monthName(m.month, "long")}</td>
              <td>{formatPrice(m.revenue)}</td>
              <td>{m.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
