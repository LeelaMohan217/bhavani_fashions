"use client";

import { useId, useRef, useState } from "react";

export type DetailTab = { title: string; body: React.ReactNode };

/**
 * Product details under the photos. Tablet/desktop: tab list down the left, text on the right.
 * Phones: tabs in a row that scrolls sideways. Arrow keys move between tabs.
 */
export function DetailTabs({ tabs }: { tabs: DetailTab[] }) {
  const id = useId();
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + tabs.length) % tabs.length;
    setActive(next);
    refs.current[next]?.focus();
  };

  return (
    <div className="md:grid md:grid-cols-[10rem_minmax(0,1fr)] md:gap-10 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-14">
      <div
        role="tablist"
        aria-label="Product details"
        aria-orientation="vertical"
        className="-mx-1 flex gap-6 overflow-x-auto border-b border-line px-1 [scrollbar-width:none] md:mx-0 md:flex-col md:gap-4 md:border-b-0 md:px-0"
      >
        {tabs.map((t, i) => (
          <button
            key={t.title}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => onKey(e, i)}
            className={`shrink-0 whitespace-nowrap border-b-2 pb-3 text-left text-sm transition-colors md:w-fit md:border-b md:pb-1 ${
              i === active ? "border-ink font-medium text-ink" : "border-transparent text-stone hover:text-ink"
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      {tabs.map((t, i) => (
        <div
          key={t.title}
          role="tabpanel"
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          hidden={i !== active}
          className="max-w-2xl pt-5 text-[0.8125rem] leading-relaxed text-ink-soft md:pt-0"
        >
          {t.body}
        </div>
      ))}
    </div>
  );
}
