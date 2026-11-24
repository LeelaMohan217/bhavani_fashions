// Neutral, utility-first primitives for the admin panel (deliberately separate from the store's editorial look).
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/types";

export const btn = {
  base: "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:pointer-events-none disabled:opacity-50",
  primary: "bg-neutral-900 text-white hover:bg-neutral-700 h-9 px-3.5",
  secondary: "border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50 h-9 px-3.5 shadow-xs",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50 h-9 px-3.5",
  ghost: "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 h-9 px-2.5",
};

export const inputCls =
  "h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 shadow-xs transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 aria-[invalid=true]:border-red-400";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div data-rise className="mb-6">
      {back && (
        <Link href={back.href} className="mb-3 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
          <ChevronLeft className="size-4" /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 md:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Card({
  title,
  action,
  children,
  className = "",
  bodyClassName = "p-5",
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section data-rise className={`rounded-lg border border-neutral-200 bg-white shadow-xs ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-4 border-b border-neutral-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

type Tone = "neutral" | "green" | "amber" | "blue" | "red" | "violet";
const TONES: Record<Tone, string> = {
  neutral: "bg-neutral-100 text-neutral-700 ring-neutral-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
};

export function Badge({ tone = "neutral", children, dot = false }: { tone?: Tone; children: React.ReactNode; dot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}>
      {dot && <span className="size-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  PENDING_PAYMENT: { label: "Awaiting payment", tone: "neutral" },
  CONFIRMED: { label: "To pack", tone: "amber" },
  PACKED: { label: "Packed", tone: "violet" },
  SHIPPED: { label: "Shipped", tone: "blue" },
  DELIVERED: { label: "Delivered", tone: "green" },
  CANCELLED: { label: "Cancelled", tone: "red" },
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Unpaid", tone: "neutral" },
  PAID: { label: "Paid", tone: "green" },
  FAILED: { label: "Failed", tone: "red" },
  COD_DUE: { label: "COD due", tone: "amber" },
  REFUND_DUE: { label: "Refund due", tone: "red" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
};

export const PAYMENT_METHOD: Record<PaymentMethod, string> = { COD: "Cash on delivery", RAZORPAY: "Razorpay" };

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status];
  return <Badge tone={s.tone} dot>{s.label}</Badge>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const s = PAYMENT_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-neutral-100">
        <Icon className="size-5 text-neutral-500" strokeWidth={1.75} />
      </span>
      <p className="mt-4 text-sm font-medium text-neutral-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

const PAGE_WINDOW = 3;

/**
 * Sliding window of up to 3 page numbers centred on the current page, clamped at the ends:
 * page 1 → 1 2 3 · page 4 → 3 4 5 · last page (12) → 10 11 12
 */
function pageWindow(page: number, totalPages: number): number[] {
  const size = Math.min(PAGE_WINDOW, totalPages);
  const start = Math.min(Math.max(1, page - Math.floor(size / 2)), totalPages - size + 1);
  return Array.from({ length: size }, (_, i) => start + i);
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  href,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  href: (page: number) => string;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const navBtn = "inline-flex size-7 items-center justify-center rounded-md transition-colors";

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-4 py-2.5">
      <p className="text-xs text-neutral-500">
        Showing <span className="font-medium tabular-nums text-neutral-900">{from}–{to}</span> of{" "}
        <span className="font-medium tabular-nums text-neutral-900">{total}</span>
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {page > 1 ? (
            <Link href={href(page - 1)} aria-label="Previous page" title="Previous page" className={`${navBtn} text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900`}>
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <span className={`${navBtn} text-neutral-300`} aria-hidden>
              <ChevronLeft className="size-4" />
            </span>
          )}

          {pageWindow(page, totalPages).map((p) => (
            <Link
              key={p}
              href={href(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              className={`inline-flex size-7 items-center justify-center rounded-md text-xs font-medium tabular-nums transition-colors ${
                p === page ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              {p}
            </Link>
          ))}

          {page < totalPages ? (
            <Link href={href(page + 1)} aria-label="Next page" title="Next page" className={`${navBtn} text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900`}>
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span className={`${navBtn} text-neutral-300`} aria-hidden>
              <ChevronRight className="size-4" />
            </span>
          )}
        </div>
      )}
    </nav>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-neutral-100" aria-busy>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="h-4 w-24 animate-pulse rounded bg-neutral-100" />
          <div className="h-4 flex-1 animate-pulse rounded bg-neutral-100" />
          <div className="h-4 w-16 animate-pulse rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}

// ─── Tables ──────────────────────────────────────────────────────────────────

/** Header cell: small uppercase muted label */
export const th = "px-4 py-2.5 text-left text-[0.68rem] font-semibold uppercase tracking-wider text-neutral-400";
/** Body cell */
export const td = "px-4 py-3";

const AVATAR_TONES = [
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

/** Initials avatar with a stable colour per name */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hash = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${AVATAR_TONES[hash % AVATAR_TONES.length]} ${
        size === "sm" ? "size-7 text-[0.65rem]" : "size-8 text-xs"
      }`}
    >
      {initials}
    </span>
  );
}

/** Small square icon button used for row actions */
export const rowAction =
  "inline-flex size-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
export const formatDate = (d: string | Date) => dateFmt.format(new Date(d));
export const formatDateTime = (d: string | Date) => dateTimeFmt.format(new Date(d));
const dayFmt = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" });
const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
/** Compact table timestamp, e.g. "24 Nov · 21:03" */
export const formatStamp = (d: string | Date) => `${dayFmt.format(new Date(d))} · ${timeFmt.format(new Date(d))}`;
