"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";

/**
 * Shared dropdown list used by <Select> and <SuggestInput> instead of the browser's
 * native pickers, so every dropdown in the app matches our design.
 *
 * Rendered in a portal with fixed positioning: it escapes cards with overflow, tables
 * that scroll sideways, and sticky bars with backdrop-filter. It opens below the
 * trigger, or above when there isn't room.
 */

export type Tone = "store" | "admin";

const LIST: Record<Tone, string> = {
  // No vertical padding: the highlighted first/last row reaches the edge instead of leaving a strip
  store: "border border-line bg-canvas shadow-[0_12px_32px_-12px_rgb(17_17_17/0.25)]",
  admin: "rounded-md border border-neutral-200 bg-white p-1 shadow-lg",
};

const OPTION: Record<Tone, { base: string; active: string; selected: string }> = {
  store: { base: "px-4 py-2.5 text-sm text-ink-soft", active: "bg-sand text-ink", selected: "font-medium text-ink" },
  admin: { base: "rounded px-2.5 py-1.5 text-sm text-neutral-700", active: "bg-neutral-100 text-neutral-900", selected: "font-medium text-neutral-900" },
};

/** Positions `list` under (or above) `anchor`, writing styles directly so it tracks scroll without re-rendering. */
function place(anchorEl: HTMLElement, list: HTMLElement, minWidth: number) {
  const r = anchorEl.getBoundingClientRect();
  const gap = 4;
  const margin = 8;
  const below = window.innerHeight - r.bottom - gap - margin;
  const above = r.top - gap - margin;
  const width = Math.min(Math.max(r.width, minWidth), window.innerWidth - margin * 2);
  const left = Math.min(Math.max(margin, r.left), window.innerWidth - width - margin);
  const openUp = below < 220 && above > below;
  const s = list.style;
  s.left = `${left}px`;
  s.width = `${width}px`;
  s.top = openUp ? "auto" : `${r.bottom + gap}px`;
  s.bottom = openUp ? `${window.innerHeight - r.top + gap}px` : "auto";
  s.maxHeight = `${Math.min(320, openUp ? above : below)}px`;
  s.visibility = "visible";
}

export function PopoverList<T extends string>({
  id,
  anchor,
  open,
  options,
  selected,
  activeIndex,
  onHover,
  onPick,
  onDismiss,
  tone,
  minWidth = 0,
  label,
}: {
  id: string;
  anchor: React.RefObject<HTMLElement | null>;
  open: boolean;
  options: { value: T; label: string }[];
  selected?: T;
  activeIndex: number;
  onHover: (i: number) => void;
  onPick: (value: T) => void;
  /** Click outside the trigger and the list */
  onDismiss: () => void;
  tone: Tone;
  minWidth?: number;
  label?: string;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const shown = open && options.length > 0;

  useLayoutEffect(() => {
    if (!shown) return;
    const update = () => anchor.current && listRef.current && place(anchor.current, listRef.current, minWidth);
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [shown, anchor, minWidth]);

  // Close on a press outside the trigger and the list
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (anchor.current?.contains(t) || listRef.current?.contains(t)) return;
      onDismiss();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, anchor, onDismiss]);

  // Keep the highlighted option in view while using the arrow keys
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  if (!shown) return null;
  const o = OPTION[tone];

  return createPortal(
    <ul
      ref={listRef}
      id={id}
      role="listbox"
      aria-label={label}
      style={{ visibility: "hidden" }}
      className={`fixed z-[60] animate-palette-in overflow-y-auto overscroll-contain ${LIST[tone]}`}
      // Keep focus on the trigger/input while clicking an option
      onMouseDown={(e) => e.preventDefault()}
    >
      {options.map((opt, i) => {
        const isSelected = opt.value === selected;
        return (
          <li
            key={opt.value}
            id={`${id}-${i}`}
            data-index={i}
            role="option"
            aria-selected={isSelected}
            onMouseMove={() => activeIndex !== i && onHover(i)}
            onClick={() => onPick(opt.value)}
            className={`flex cursor-pointer items-center justify-between gap-3 ${o.base} ${i === activeIndex ? o.active : ""} ${isSelected ? o.selected : ""}`}
          >
            <span className="truncate">{opt.label}</span>
            {isSelected && <Check className="size-4 shrink-0" strokeWidth={1.75} />}
          </li>
        );
      })}
    </ul>,
    document.body,
  );
}
