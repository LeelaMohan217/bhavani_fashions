"use client";

import { useCallback, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { PopoverList, type Tone } from "./popover-list";

export type SelectOption<T extends string = string> = { value: T; label: string };

/**
 * Our own dropdown, replacing the native <select> (whose look and phone picker
 * come from the browser). Keyboard: arrows, Home/End, Enter/Space, Escape, and
 * typing a letter jumps to the next option that starts with it.
 */
export function Select<T extends string>({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = "Select…",
  tone = "store",
  className = "",
  invalid,
  describedBy,
  ariaLabel,
  minListWidth,
  children,
}: {
  id?: string;
  /** Submitted with the surrounding form via a hidden input */
  name?: string;
  value: T | "";
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  tone?: Tone;
  /** Classes for the trigger button (match the surrounding inputs) */
  className?: string;
  invalid?: boolean;
  describedBy?: string;
  ariaLabel?: string;
  minListWidth?: number;
  /** Custom trigger content; defaults to the selected label (or placeholder) and a chevron */
  children?: (selected: SelectOption<T> | undefined, open: boolean) => React.ReactNode;
}) {
  const autoId = useId();
  const triggerId = id ?? `select-${autoId}`;
  const listId = `${triggerId}-list`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = options[selectedIndex];

  const show = (index = selectedIndex >= 0 ? selectedIndex : 0) => {
    setActive(index);
    setOpen(true);
  };
  const close = useCallback(() => setOpen(false), []);
  const pick = (v: T) => {
    if (v !== value) onChange(v);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = options.length - 1;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(last, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(last);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (options[active]) pick(options[active].value);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        close();
        break;
      default:
        // Type-ahead: jump to the next option starting with this letter
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const k = e.key.toLowerCase();
          const n = options.length;
          for (let step = 1; step <= n; step++) {
            const i = (active + step) % n;
            if (options[i].label.toLowerCase().startsWith(k)) {
              setActive(i);
              break;
            }
          }
        }
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-label={ariaLabel}
        onClick={() => (open ? close() : show())}
        onKeyDown={onKeyDown}
        className={className}
      >
        {children ? (
          children(selected, open)
        ) : (
          <>
            <span className={`min-w-0 flex-1 truncate text-left ${selected ? "" : "opacity-60"}`}>
              {selected?.label ?? placeholder}
            </span>
            <ChevronDown
              className={`size-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              strokeWidth={1.5}
              aria-hidden
            />
          </>
        )}
      </button>
      {name && <input type="hidden" name={name} value={value} />}
      <PopoverList
        id={listId}
        anchor={triggerRef}
        open={open}
        options={options}
        selected={value || undefined}
        activeIndex={active}
        onHover={setActive}
        onPick={pick}
        onDismiss={close}
        tone={tone}
        minWidth={minListWidth}
      />
    </>
  );
}
