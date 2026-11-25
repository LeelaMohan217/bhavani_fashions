"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { NavNode } from "@/lib/types";

const CLOSE_DELAY = 140;
const MORE_ID = "__more";

/**
 * Desktop header links from Admin → Navigation. A link with links under it opens a full-width panel
 * below the header, in columns. Links that don't fit on one row move into a "More" menu at the end.
 * The panel is positioned against the <header>, so nothing between them may be `relative`.
 */
export function HeaderMenu({ items }: { items: NavNode[] }) {
  const pathname = usePathname();
  // The open menu remembers the page it was opened on, so moving to another page closes it
  const [opened, setOpened] = useState<{ id: string; path: string } | null>(null);
  const openId = opened?.path === pathname ? opened.id : null;
  const setOpenId = useCallback((id: string | null) => setOpened(id ? { id, path: pathname } : null), [pathname]);
  const [fit, setFit] = useState(items.length);
  const row = useRef<HTMLDivElement>(null);
  const measure = useRef<HTMLUListElement>(null);
  const timer = useRef<number | undefined>(undefined);

  // How many links fit: measured from an invisible copy of the full row
  const recount = useCallback(() => {
    const box = row.current;
    const list = measure.current;
    if (!box || !list) return;
    const widths = [...list.children].map((el) => (el as HTMLElement).offsetWidth);
    const more = widths.pop() ?? 0; // the last measured item is the "More" button
    const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
    const available = box.clientWidth;
    const total = widths.reduce((a, w) => a + w, 0) + gap * Math.max(0, widths.length - 1);
    if (total <= available) return setFit(widths.length);
    let used = more;
    let n = 0;
    for (const w of widths) {
      if (used + gap + w > available) break;
      used += gap + w;
      n++;
    }
    setFit(Math.max(0, n));
  }, []);

  useLayoutEffect(() => {
    recount();
    const ro = new ResizeObserver(recount);
    if (row.current) ro.observe(row.current);
    return () => ro.disconnect();
  }, [recount, items]);

  // Close on Escape, or a press outside the menu (taps on touch screens never "leave")
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenId(null);
    const onDown = (e: PointerEvent) => !row.current?.contains(e.target as Node) && setOpenId(null);
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [openId, setOpenId]);

  /** Hover already opens it, so a mouse click or tap keeps it open; the keyboard (detail 0) toggles */
  const onTrigger = (id: string, e: React.MouseEvent) => setOpenId(openId === id && e.detail === 0 ? null : id);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const openSoon = (id: string) => {
    window.clearTimeout(timer.current);
    setOpenId(id);
  };
  const closeSoon = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpenId(null), CLOSE_DELAY);
  };

  if (items.length === 0) return null;
  const shown = items.slice(0, fit);
  const hidden = items.slice(fit);
  const open = openId === MORE_ID ? null : items.find((i) => i.id === openId);

  return (
    <div ref={row} className="min-w-0" onMouseLeave={closeSoon}>
      {/* Invisible copy of every link plus "More", only to measure widths */}
      <ul ref={measure} aria-hidden className="pointer-events-none invisible absolute -z-10 flex h-0 gap-8 overflow-hidden whitespace-nowrap">
        {items.map((i) => (
          <li key={i.id} className="eyebrow flex items-center gap-1">
            <TopLabel item={i} />
          </li>
        ))}
        <li className="eyebrow flex items-center gap-1">
          More <ChevronDown className="size-3" />
        </li>
      </ul>

      <ul className="flex items-center justify-center gap-8 whitespace-nowrap">
        {shown.map((i) => {
          const hasPanel = i.children.length > 0;
          const isOpen = openId === i.id;
          return (
            <li key={i.id} onMouseEnter={() => (hasPanel ? openSoon(i.id) : closeSoon())}>
              {hasPanel ? (
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  onClick={(e) => onTrigger(i.id, e)}
                  className={`eyebrow flex items-center gap-1 pb-1 transition-colors hover:text-ink ${isOpen ? "text-ink" : "text-ink-soft"}`}
                >
                  <TopLabel item={i} />
                  <ChevronDown className={`size-3 transition-transform ${isOpen ? "rotate-180" : ""}`} strokeWidth={1.75} />
                </button>
              ) : (
                <Link href={i.href!} className="eyebrow link-draw flex items-center gap-1 pb-1 text-ink-soft hover:text-ink">
                  <TopLabel item={i} />
                </Link>
              )}
            </li>
          );
        })}
        {hidden.length > 0 && (
          <li className="relative" onMouseEnter={() => openSoon(MORE_ID)}>
            <button
              type="button"
              aria-expanded={openId === MORE_ID}
              aria-haspopup="true"
              onClick={(e) => onTrigger(MORE_ID, e)}
              className={`eyebrow flex items-center gap-1 pb-1 transition-colors hover:text-ink ${openId === MORE_ID ? "text-ink" : "text-ink-soft"}`}
            >
              More
              <ChevronDown className={`size-3 transition-transform ${openId === MORE_ID ? "rotate-180" : ""}`} strokeWidth={1.75} />
            </button>
            {openId === MORE_ID && <MoreList items={hidden} />}
          </li>
        )}
      </ul>

      {open && (
        <div
          onMouseEnter={() => openSoon(open.id)}
          className="absolute inset-x-0 top-full z-30 animate-fade-in border-b border-line bg-canvas shadow-[0_24px_40px_-24px_rgb(17_17_17/0.25)]"
        >
          <Panel item={open} />
        </div>
      )}
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return <span className="rounded-full bg-clay px-1.5 py-px text-[0.55rem] font-semibold normal-case tracking-normal text-canvas">{text}</span>;
}

function TopLabel({ item }: { item: NavNode }) {
  return (
    <>
      {item.label}
      {item.badge && <Badge text={item.badge} />}
    </>
  );
}

/** The wide dropdown: links with their own links become columns; single links share the first column */
function Panel({ item }: { item: NavNode }) {
  const singles = item.children.filter((c) => c.children.length === 0);
  const groups = item.children.filter((c) => c.children.length > 0);
  const link = "text-sm text-ink-soft transition-colors hover:text-ink";

  return (
    <div className="container-x flex gap-10 py-7">
      <div className="grid flex-1 grid-cols-4 gap-x-10 gap-y-6">
        {singles.length > 0 && (
          <ul className="space-y-2.5">
            {singles.map((c) => (
              <li key={c.id}>
                <Link href={c.href!} className={`${link} inline-flex items-center gap-1.5`}>
                  {c.label}
                  {c.badge && <Badge text={c.badge} />}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {groups.map((g) => (
          <div key={g.id}>
            {g.href ? (
              <Link href={g.href} className="eyebrow inline-flex items-center gap-1.5 text-ink hover:text-clay">
                {g.label}
                {g.badge && <Badge text={g.badge} />}
              </Link>
            ) : (
              <p className="eyebrow inline-flex items-center gap-1.5 text-ink">
                {g.label}
                {g.badge && <Badge text={g.badge} />}
              </p>
            )}
            <ul className="mt-3 space-y-2.5">
              {g.children.map((c) => (
                <li key={c.id}>
                  <Link href={c.href!} className={link}>
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {item.href && (
        <Link href={item.href} className="eyebrow group flex shrink-0 items-start gap-2 self-start text-ink hover:text-clay">
          Shop all {item.label}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
        </Link>
      )}
    </div>
  );
}

/** "More": the links that didn't fit, with anything under them indented */
function MoreList({ items }: { items: NavNode[] }) {
  const row = (n: NavNode, depth: number) => {
    const cls = `flex items-center gap-1.5 py-1.5 text-sm ${depth === 0 ? "font-medium text-ink" : "text-ink-soft hover:text-ink"}`;
    return (
      <li key={n.id}>
        {n.href ? (
          <Link href={n.href} className={`${cls} hover:text-clay`} style={{ paddingLeft: depth * 12 }}>
            {n.label}
            {n.badge && <Badge text={n.badge} />}
          </Link>
        ) : (
          <p className={cls} style={{ paddingLeft: depth * 12 }}>
            {n.label}
          </p>
        )}
        {n.children.length > 0 && <ul>{n.children.map((c) => row(c, depth + 1))}</ul>}
      </li>
    );
  };
  return (
    <div className="absolute right-0 top-full z-30 mt-2 max-h-[70vh] w-64 animate-fade-in overflow-y-auto overscroll-contain border border-line bg-canvas px-4 py-3 shadow-[0_24px_40px_-24px_rgb(17_17_17/0.3)]">
      <ul>{items.map((i) => row(i, 0))}</ul>
    </div>
  );
}
