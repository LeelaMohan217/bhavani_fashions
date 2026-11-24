"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, ExternalLink, LogOut, PackageCheck, Receipt, RotateCcw, TriangleAlert } from "lucide-react";
import { logout } from "@/lib/admin/actions";
import type { Admin, AdminAlerts } from "@/lib/admin/types";
import { formatPrice } from "@/lib/format";
import { CommandPalette } from "./command-palette";

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function TopBar({ admin, alerts }: { admin: Admin; alerts: AdminAlerts }) {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:px-8">
        <CommandPalette toFulfil={alerts.toFulfilCount} />

        <div className="ml-auto flex items-center gap-1">
          <Notifications alerts={alerts} />
          <ProfileMenu admin={admin} />
        </div>
      </div>
    </header>
  );
}

/** Open/close state for a popover that closes on outside click or Escape. */
function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    const unlock = lockPageScroll();
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
      unlock();
    };
  }, [open]);

  return { open, setOpen, ref };
}

/**
 * Stops the page behind an open menu from scrolling. Pads the page by the scrollbar's
 * width so content doesn't shift sideways when the scrollbar disappears.
 */
function lockPageScroll() {
  const html = document.documentElement;
  const scrollbar = window.innerWidth - html.clientWidth;
  const prev = { overflow: html.style.overflow, paddingRight: html.style.paddingRight };
  html.style.overflow = "hidden";
  if (scrollbar > 0) html.style.paddingRight = `${scrollbar}px`;
  return () => {
    html.style.overflow = prev.overflow;
    html.style.paddingRight = prev.paddingRight;
  };
}

const daysAgo = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return d <= 0 ? "today" : d === 1 ? "1 day ago" : `${d} days ago`;
};

/** Bell with "needs attention" items: orders to ship, refunds due, low stock. */
function Notifications({ alerts }: { alerts: AdminAlerts }) {
  const { open, setOpen, ref } = usePopover();
  const close = () => setOpen(false);
  const count = alerts.total;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={count ? `Notifications, ${count} need attention` : "Notifications"}
        className={`relative inline-flex size-9 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 ${
          open ? "bg-neutral-100 text-neutral-900" : ""
        }`}
      >
        <Bell className="size-[1.1rem]" />
        {count > 0 && (
          // Small dot at the bell's corner — the exact count is in the panel header and aria-label
          <span aria-hidden className="absolute right-[0.55rem] top-[0.5rem] size-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-40 mt-1.5 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <p className="text-sm font-semibold">Needs attention</p>
            {count > 0 && <span className="text-xs tabular-nums text-neutral-500">{count} items</span>}
          </div>

          {count === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-emerald-50">
                <PackageCheck className="size-5 text-emerald-600" />
              </span>
              <p className="mt-3 text-sm font-medium">You&rsquo;re all caught up</p>
              <p className="mt-1 text-xs text-neutral-500">No orders to ship, refunds due or low stock.</p>
            </div>
          ) : (
            <div className="max-h-[min(28rem,70vh)] divide-y divide-neutral-100 overflow-y-auto overscroll-contain">
              {alerts.refundsDue.length > 0 && (
                <Group title="Refunds due" tone="red">
                  {alerts.refundsDue.map((o) => (
                    <Item
                      key={o.id}
                      href={`/admin/orders/${o.id}`}
                      onNavigate={close}
                      icon={<RotateCcw className="size-4 text-red-600" />}
                      title={`Refund ${formatPrice(o.total)} · ${o.number}`}
                      meta={`${o.fullName} · waiting ${daysAgo(o.updatedAt)}`}
                    />
                  ))}
                </Group>
              )}

              {alerts.toFulfil.length > 0 && (
                <Group
                  title="Waiting to ship"
                  tone="amber"
                  more={alerts.toFulfilCount > alerts.toFulfil.length ? { href: "/admin/orders?status=to-fulfil", label: `View all ${alerts.toFulfilCount}` } : undefined}
                  onNavigate={close}
                >
                  {alerts.toFulfil.map((o) => (
                    <Item
                      key={o.id}
                      href={`/admin/orders/${o.id}`}
                      onNavigate={close}
                      icon={<Receipt className="size-4 text-amber-600" />}
                      title={`${o.number} · ${o.status === "PACKED" ? "packed, ready to ship" : "to pack"}`}
                      meta={`${o.fullName} · ${formatPrice(o.total)} · placed ${daysAgo(o.createdAt)}`}
                    />
                  ))}
                </Group>
              )}

              {alerts.lowStock.length > 0 && (
                <Group
                  title="Low stock"
                  tone="neutral"
                  more={alerts.lowStockCount > alerts.lowStock.length ? { href: "/admin#low-stock", label: `View all ${alerts.lowStockCount}` } : undefined}
                  onNavigate={close}
                >
                  {alerts.lowStock.map((v) => (
                    <Item
                      key={v.id}
                      href={`/admin/products/${v.product.id}`}
                      onNavigate={close}
                      icon={<TriangleAlert className={`size-4 ${v.stock === 0 ? "text-red-600" : "text-neutral-500"}`} />}
                      title={v.product.name}
                      meta={`${v.color}${v.size ? ` · ${v.size}` : ""} · ${v.stock === 0 ? "sold out" : `${v.stock} left`}`}
                    />
                  ))}
                </Group>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Group({
  title,
  tone,
  more,
  onNavigate,
  children,
}: {
  title: string;
  tone: "red" | "amber" | "neutral";
  more?: { href: string; label: string };
  onNavigate?: () => void;
  children: React.ReactNode;
}) {
  const dot = tone === "red" ? "bg-red-500" : tone === "amber" ? "bg-amber-500" : "bg-neutral-400";
  return (
    <section className="py-1.5">
      <div className="flex items-center justify-between px-4 py-1.5">
        <h3 className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wider text-neutral-500">
          <span className={`size-1.5 rounded-full ${dot}`} />
          {title}
        </h3>
        {more && (
          <Link href={more.href} onClick={onNavigate} className="text-xs text-neutral-500 hover:text-neutral-900">
            {more.label}
          </Link>
        )}
      </div>
      <ul>{children}</ul>
    </section>
  );
}

function Item({
  href,
  icon,
  title,
  meta,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  meta: string;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link href={href} onClick={onNavigate} className="flex items-start gap-3 px-4 py-2 hover:bg-neutral-50">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <span className="min-w-0">
          <span className="block truncate text-sm">{title}</span>
          <span className="block truncate text-xs text-neutral-500">{meta}</span>
        </span>
      </Link>
    </li>
  );
}

function ProfileMenu({ admin }: { admin: Admin }) {
  const { open, setOpen, ref } = usePopover();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${admin.name}`}
        title={admin.name}
        className={`flex size-9 items-center justify-center rounded-full transition-shadow hover:ring-2 hover:ring-neutral-200 ${
          open ? "ring-2 ring-neutral-300" : ""
        }`}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-neutral-900 text-xs font-medium text-white">
          {initials(admin.name)}
        </span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-40 mt-1.5 w-60 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg">
          <div className="border-b border-neutral-100 px-3 py-2.5">
            <p className="truncate text-sm font-medium">{admin.name}</p>
            <p className="truncate text-xs text-neutral-500">{admin.email}</p>
          </div>
          <div className="py-1">
            <Link
              role="menuitem"
              href="/"
              target="_blank"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              <ExternalLink className="size-4 text-neutral-500" /> View store
            </Link>
            <form action={logout}>
              <button
                role="menuitem"
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                <LogOut className="size-4 text-neutral-500" /> Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
