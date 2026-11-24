"use client";

import { forwardRef, useCallback, useId, useImperativeHandle, useRef, useState } from "react";
import { PopoverList, type Tone } from "./popover-list";

/**
 * Text input with our own suggestion list, replacing <input list> + <datalist>.
 * Typing still allows any value; suggestions filter as you type.
 */
export const SuggestInput = forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "list"> & {
    value: string;
    suggestions: string[];
    /** Called when a suggestion is picked */
    onPick: (value: string) => void;
    tone?: Tone;
  }
>(function SuggestInput({ value, suggestions, onPick, tone = "admin", onKeyDown, onFocus, onBlur, onChange, id, ...props }, ref) {
  const autoId = useId();
  const listId = `${id ?? autoId}-suggestions`;
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const q = value.trim().toLowerCase();
  // Exact match hides the list (nothing left to suggest)
  const matches = suggestions.filter((s) => s.toLowerCase().includes(q) && s.toLowerCase() !== q);
  const options = matches.map((s) => ({ value: s, label: s }));
  const close = useCallback(() => setOpen(false), []);

  const pick = (v: string) => {
    onPick(v);
    setOpen(false);
    setActive(-1);
  };

  return (
    <>
      <input
        {...props}
        ref={inputRef}
        id={id}
        value={value}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && options.length > 0}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        onChange={(e) => {
          onChange?.(e);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={(e) => {
          setOpen(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setOpen(false);
          onBlur?.(e);
        }}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((i) => Math.min(options.length - 1, i + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(0, i - 1));
          } else if (e.key === "Enter" && open && options[active]) {
            e.preventDefault();
            pick(options[active].value);
          } else if (e.key === "Escape" && open) {
            e.preventDefault();
            close();
          }
          onKeyDown?.(e);
        }}
      />
      <PopoverList
        id={listId}
        anchor={inputRef}
        open={open}
        options={options}
        activeIndex={active}
        onHover={setActive}
        onPick={pick}
        onDismiss={close}
        tone={tone}
        minWidth={120}
      />
    </>
  );
});
