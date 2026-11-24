"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LifeBuoy, PanelLeftClose, PanelLeftOpen, Receipt, Settings, Shirt, X } from "lucide-react";
import type { Admin, AdminAlerts } from "@/lib/admin/types";
import { TopBar } from "./top-bar";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: Receipt, badgeKey: "toFulfil" as const },
  { href: "/admin/products", label: "Products", icon: Shirt },
];

const FOOTER_NAV = [
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/help", label: "Help & Support", icon: LifeBuoy },
];

// ─── Remembered collapsed state (per browser) ────────────────────────────────
const STORAGE_KEY = "bf-admin-sidebar-collapsed";
const EVENT = "bf-admin-sidebar";

function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // Storage blocked (private mode etc.) — the toggle still works for this page view.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function useCollapsed() {
  // Server render is always expanded; the client switches to the saved preference after hydrating.
  return useSyncExternalStore(subscribe, readCollapsed, () => false);
}

// ─── Shell ───────────────────────────────────────────────────────────────────

export function AdminShell({ admin, alerts, children }: { admin: Admin; alerts: AdminAlerts; children: React.ReactNode }) {
  const toFulfil = alerts.toFulfilCount;
  const [open, setOpen] = useState(false);
  const collapsed = useCollapsed();
  // Animate only when the user toggles — not when the saved preference is applied on page load.
  const [animate, setAnimate] = useState(false);
  const toggle = () => {
    setAnimate(true);
    writeCollapsed(!readCollapsed());
  };

  // ─── Sliding highlight: measure the current item and move the pill to it ───
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);

  useLayoutEffect(() => {
    const place = () => {
      const box = navRef.current;
      const pill = indicatorRef.current;
      if (!box || !pill) return;
      const current = box.querySelector<HTMLElement>('[data-nav-item][aria-current="page"]');
      if (!current) {
        pill.style.opacity = "0";
        return;
      }
      const top = current.getBoundingClientRect().top - box.getBoundingClientRect().top;
      // First placement snaps into position; later moves glide.
      pill.style.transition = placed.current
        ? "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), height 0.3s ease, opacity 0.2s ease"
        : "none";
      pill.style.transform = `translateY(${top}px)`;
      pill.style.height = `${current.offsetHeight}px`;
      pill.style.opacity = "1";
      placed.current = true;
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [pathname, collapsed]);

  // Ctrl/⌘ + B toggles the rail, like most editors
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setAnimate(true);
        writeCollapsed(!readCollapsed());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      style={{ "--sidebar-w": collapsed ? "4rem" : "15rem" } as React.CSSProperties}
      className={`min-h-screen bg-neutral-50 font-sans text-neutral-900 lg:pl-[var(--sidebar-w)] ${animate ? "transition-[padding] duration-200" : ""}`}
    >
      <TopBar admin={admin} alerts={alerts} onOpenNav={() => setOpen(true)} />

      {/* Sidebar: fixed on desktop (full or icon rail), drawer on mobile */}
      {open && <div className="fixed inset-0 z-40 bg-neutral-900/30 lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        data-collapsed={collapsed || undefined}
        className={`group/sidebar fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-neutral-200 bg-white duration-200 lg:w-[var(--sidebar-w)] lg:translate-x-0 ${
          animate ? "transition-[width,transform]" : "transition-transform lg:transition-none"
        } ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/*
          Header layout never changes between states, so nothing jumps:
          the wordmark fades in/out, and the toggle is pinned 1rem from the right edge —
          which is exactly centred on the 4rem rail and glides with the edge as it widens.
        */}
        <div className="relative flex h-14 items-center px-5">
          <Brand collapsed={collapsed} animate={animate} />

          {/* Positioning lives on this wrapper; RailItem itself must stay `relative` for its tooltip */}
          <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 lg:block">
            <RailItem collapsed={collapsed} label="Expand sidebar · Ctrl B">
              <button
                type="button"
                onClick={toggle}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!collapsed}
                title={collapsed ? undefined : "Collapse sidebar (Ctrl B)"}
                className="flex size-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              >
                {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
              </button>
            </RailItem>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="-mr-2 ml-auto inline-flex size-8 items-center justify-center rounded-md hover:bg-neutral-100 lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Sliding active highlight — one pill that glides to whichever item is current */}
        <div className="relative flex flex-1 flex-col" ref={navRef}>
          <span
            ref={indicatorRef}
            aria-hidden
            className="pointer-events-none absolute inset-x-3 top-0 rounded-md bg-neutral-100 opacity-0"
          />

          <nav aria-label="Admin" className="flex-1 space-y-0.5 px-3 py-3">
            {NAV.map((item, i) => (
              <NavLink
                key={item.href}
                {...item}
                index={i}
                collapsed={collapsed}
                badge={item.badgeKey ? toFulfil : 0}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </nav>

          <nav aria-label="Support" className="space-y-0.5 p-3">
            {FOOTER_NAV.map((item, i) => (
              <NavLink
                key={item.href}
                {...item}
                index={NAV.length + i}
                collapsed={collapsed}
                badge={0}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </nav>
        </div>
      </aside>

      <main id="main" data-admin-main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}

function Brand({ collapsed, animate }: { collapsed: boolean; animate: boolean }) {
  return (
    // On the collapsed desktop rail the "B" expand button stands in for the wordmark.
    <Link
      href="/admin"
      aria-label="Bhavani admin home"
      tabIndex={collapsed ? -1 : undefined}
      // Fades rather than unmounting; waits a beat on expand so it appears once there's room.
      // Only animate when the user toggles — not when the saved state is applied on load
      className={`flex items-baseline gap-2 whitespace-nowrap ${animate ? "transition-opacity duration-150" : ""} ${
        collapsed ? "lg:pointer-events-none lg:opacity-0" : "delay-100"
      }`}
    >
      <span className="font-display text-xl tracking-tight">Bhavani</span>
      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-neutral-500">
        Admin
      </span>
    </Link>
  );
}

/** Wraps a sidebar item so the collapsed desktop rail shows its label as a tooltip on hover/focus. */
function RailItem({
  collapsed,
  label,
  children,
  className = "",
  style,
}: {
  collapsed: boolean;
  label: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`group/item relative ${className}`} style={style}>
      {children}
      {collapsed && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-xs font-medium text-white shadow-md lg:group-hover/item:block lg:group-has-[:focus-visible]/item:block"
        >
          {label}
        </span>
      )}
    </div>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
  badge,
  collapsed,
  index,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge: number;
  collapsed: boolean;
  /** Position in the sidebar, used to stagger the slide-in */
  index: number;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <RailItem
      collapsed={collapsed}
      label={badge > 0 ? `${label} · ${badge} to fulfil` : label}
      className="animate-sidebar-in"
      style={{ animationDelay: `${80 + index * 55}ms` }}
    >
      <Link
        href={href}
        onClick={onNavigate}
        data-nav-item
        aria-current={active ? "page" : undefined}
        // The active background is the sliding pill behind this link (see AdminShell).
        // Layout is identical in both states — px-3 puts the icon dead-centre on the 4rem rail —
        // so expanding only reveals the label (clipped by overflow-hidden) instead of re-flowing.
        className={`group/link relative flex items-center gap-3 overflow-hidden rounded-md px-3 py-2 text-sm transition-colors duration-200 ${
          active ? "font-medium text-neutral-900" : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
        }`}
      >
        <Icon
          className={`size-4 shrink-0 ${active ? "text-neutral-900" : ""}`}
        />
        <span
          className={`flex-1 whitespace-nowrap pr-8 transition-opacity duration-200 ${collapsed ? "lg:opacity-0" : "delay-75"}`}
        >
          {label}
        </span>
        {badge > 0 && (
          // Glides between the row's right end (expanded) and the icon's corner (rail)
          <span
            className={`absolute block min-w-[1.125rem] rounded-full bg-neutral-900 text-center font-semibold tabular-nums text-white transition-all duration-200 ${
              collapsed
                ? "right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[0.65rem] lg:right-0.5 lg:top-0 lg:min-w-4 lg:translate-y-0 lg:px-1 lg:py-0 lg:text-[0.6rem] lg:leading-4 lg:ring-2 lg:ring-white"
                : "right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[0.65rem]"
            }`}
          >
            {badge}
          </span>
        )}
      </Link>
    </RailItem>
  );
}

/**
 * Shown on a full page load while the admin session and alert counts load.
 * Mirrors the real shell (sidebar, top bar) and uses the same card + pulsing-bar
 * style as the page skeletons, so the hand-off to real content doesn't jump.
 */
export function ShellSkeleton() {
  const bar = "animate-pulse rounded bg-neutral-100";
  return (
    <div className="min-h-screen bg-neutral-50 lg:pl-60" aria-busy aria-label="Loading admin">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-neutral-200 bg-white lg:flex">
        <div className="flex h-14 items-center justify-between px-5">
          <span className="font-display text-xl tracking-tight text-neutral-300">Bhavani</span>
          <span className={`${bar} size-4`} />
        </div>
        <div className="flex-1 space-y-1 px-3 py-3">
          {[24, 16, 20].map((w, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2">
              <span className={`${bar} size-4`} />
              <span className={`${bar} h-3.5`} style={{ width: `${w * 4}px` }} />
            </div>
          ))}
        </div>
        <div className="space-y-1 p-3">
          {[18, 26].map((w, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2">
              <span className={`${bar} size-4`} />
              <span className={`${bar} h-3.5`} style={{ width: `${w * 4}px` }} />
            </div>
          ))}
        </div>
      </div>

      {/* Top bar */}
      <div className="h-14 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-full max-w-6xl items-center gap-3 px-4 md:px-8">
          <span className="h-9 flex-1 rounded-md border border-neutral-200 bg-neutral-50 sm:max-w-sm xl:max-w-[calc(50%-0.5rem)]" />
          <span className="ml-auto flex items-center gap-2">
            <span className={`${bar} size-8 rounded-full`} />
            <span className="size-8 animate-pulse rounded-full bg-neutral-200" />
          </span>
        </div>
      </div>

      {/* Page */}
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
        <div className="space-y-2.5">
          <span className="block h-7 w-56 animate-pulse rounded bg-neutral-200/70" />
          <span className={`${bar} block h-4 w-40`} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-neutral-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className={`${bar} h-4 w-24`} />
                <span className={`${bar} size-8 rounded-md`} />
              </div>
              <span className={`${bar} mt-4 block h-7 w-20`} />
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white shadow-xs">
          <div className="border-b border-neutral-100 px-5 py-3.5">
            <span className={`${bar} block h-4 w-28`} />
          </div>
          <div className="divide-y divide-neutral-100">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <span className={`${bar} h-4 w-24`} />
                <span className={`${bar} h-4 flex-1`} />
                <span className={`${bar} h-4 w-16`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
