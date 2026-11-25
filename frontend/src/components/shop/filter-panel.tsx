"use client";

import { useId, useState } from "react";
import { Check } from "lucide-react";
import { PRICE_RANGES } from "@/lib/content";
import type { ProductFilters } from "@/lib/types";
import type { FilterKey, Selection } from "@/lib/shop-filters";

type Option = { value: string; label: string; count?: number; hex?: string };

const SHOW_FIRST = 6;

/**
 * The shop filters: Price, Occasion, Colour and Fabric, each a collapsible list of checkboxes.
 * Ticking several options in one section widens the results (any of them); sections narrow
 * each other (all of them). Used by the desktop sidebar and the phone filter sheet.
 */
export function FilterPanel({
  filters,
  value,
  onToggle,
}: {
  filters: ProductFilters;
  value: Selection;
  onToggle: (key: FilterKey, option: string) => void;
}) {
  // Matching ignores case, so links like ?color=rose still tick "Rose"
  const ticked = (key: FilterKey, v: string) => value[key].some((s) => s.toLowerCase() === v.toLowerCase());

  const sections: { key: FilterKey; title: string; options: Option[] }[] = [
    { key: "price", title: "Price", options: PRICE_RANGES.map((r) => ({ value: r.key, label: r.label })) },
    { key: "occasion", title: "Occasion", options: filters.occasions.map((o) => ({ value: o.name, label: o.name, count: o.count })) },
    { key: "color", title: "Colour", options: filters.colors.map((c) => ({ value: c.name, label: c.name, count: c.count, hex: c.hex })) },
    { key: "fabric", title: "Fabric", options: filters.fabrics.map((f) => ({ value: f.name, label: f.name, count: f.count })) },
  ];

  return (
    // Ink-tinted lines read on both the cream sheet and the sand sidebar panel
    <div className="divide-y divide-ink/10 border-t border-ink/10">
      {sections
        .filter((s) => s.options.length > 0)
        .map((s) => (
          <Section
            key={s.key}
            title={s.title}
            selected={value[s.key].length}
            options={s.options}
            isTicked={(v) => ticked(s.key, v)}
            onToggle={(v) => onToggle(s.key, v)}
          />
        ))}
    </div>
  );
}

function Section({
  title,
  selected,
  options,
  isTicked,
  onToggle,
}: {
  title: string;
  selected: number;
  options: Option[];
  isTicked: (v: string) => boolean;
  onToggle: (v: string) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(true);
  // Long lists start short, but never hide an option that's ticked
  const [showAll, setShowAll] = useState(false);
  const firstTicked = options.findLastIndex((o) => isTicked(o.value));
  const visible = showAll ? options : options.slice(0, Math.max(SHOW_FIRST, firstTicked + 1));
  const hidden = options.length - visible.length;

  return (
    <section className="py-4">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="group/toggle flex w-full cursor-pointer items-center justify-between text-left"
        >
          <span className="eyebrow text-ink">
            {title}
            {selected > 0 && <span className="ml-2 text-clay">{selected}</span>}
          </span>
          <ToggleIcon open={open} />
        </button>
      </h3>

      <div id={id} hidden={!open}>
        <ul className="mt-3 space-y-0.5">
          {visible.map((o) => {
            const on = isTicked(o.value);
            return (
              <li key={o.value}>
                <label className="group flex cursor-pointer items-center gap-3 py-1.5 text-sm">
                  <input type="checkbox" checked={on} onChange={() => onToggle(o.value)} className="peer sr-only" />
                  <span
                    aria-hidden
                    className={`flex size-4 shrink-0 items-center justify-center border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink ${
                      on ? "border-ink bg-ink text-canvas" : "border-stone/50 bg-canvas group-hover:border-ink"
                    }`}
                  >
                    {on && <Check className="size-3" strokeWidth={2.25} />}
                  </span>
                  {o.hex && (
                    <span
                      aria-hidden
                      className="size-3.5 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(17_17_17/0.18)]"
                      style={{ backgroundColor: o.hex }}
                    />
                  )}
                  <span className={`min-w-0 flex-1 truncate ${on ? "text-ink" : "text-ink-soft group-hover:text-ink"}`}>{o.label}</span>
                  {o.count !== undefined && <span className="text-xs tabular-nums text-stone">{o.count}</span>}
                </label>
              </li>
            );
          })}
        </ul>
        {(hidden > 0 || showAll) && options.length > SHOW_FIRST && (
          <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-2 text-xs text-stone underline-offset-4 hover:text-ink hover:underline">
            {showAll ? "Show fewer" : `Show ${hidden} more`}
          </button>
        )}
      </div>
    </section>
  );
}

/**
 * Plus that turns into a minus: the upright bar folds away when the section opens. On hover a
 * soft circle fills in behind it and the icon spins half a turn (so + and − keep their shape),
 * and it presses in slightly on click.
 */
function ToggleIcon({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden
      // Negative margins keep the 28px hover circle from making each section taller
      className="relative -my-1.5 -mr-1.5 flex size-7 shrink-0 items-center justify-center rounded-full text-stone transition-[background-color,color,rotate,scale] duration-300 ease-out group-hover/toggle:rotate-180 group-hover/toggle:bg-ink/[0.07] group-hover/toggle:text-ink group-active/toggle:scale-90 motion-reduce:transition-none motion-reduce:group-hover/toggle:rotate-0"
    >
      <span className="absolute h-[1.5px] w-3 rounded-full bg-current" />
      <span
        className={`absolute h-3 w-[1.5px] rounded-full bg-current transition-transform duration-300 ease-out motion-reduce:transition-none ${
          open ? "scale-y-0" : "scale-y-100"
        }`}
      />
    </span>
  );
}

/** Adds the option if it isn't ticked, removes it if it is (ignoring case). */
export function toggleOption(s: Selection, key: FilterKey, option: string): Selection {
  const has = s[key].some((v) => v.toLowerCase() === option.toLowerCase());
  return { ...s, [key]: has ? s[key].filter((v) => v.toLowerCase() !== option.toLowerCase()) : [...s[key], option] };
}
