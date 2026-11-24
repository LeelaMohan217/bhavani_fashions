"use client";

import { Minus, Plus } from "lucide-react";

export function QuantityStepper({
  value,
  max,
  onChange,
  disabled = false,
  size = "sm",
  label,
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  size?: "sm" | "lg";
  label: string;
}) {
  const h = size === "lg" ? "h-14" : "h-9";
  const w = size === "lg" ? "w-11" : "w-8";

  return (
    <div className={`inline-flex items-center border border-line ${h} ${disabled ? "opacity-50" : ""}`}>
      <button
        type="button"
        aria-label={`Decrease quantity of ${label}`}
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
        className={`inline-flex h-full ${w} items-center justify-center transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:text-stone/50 disabled:hover:bg-transparent`}
      >
        <Minus className="size-3.5" strokeWidth={1.5} />
      </button>
      <span className="w-7 text-center text-sm tabular-nums" aria-live="polite" aria-label={`Quantity ${value}`}>
        {value}
      </span>
      <button
        type="button"
        aria-label={`Increase quantity of ${label}`}
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
        className={`inline-flex h-full ${w} items-center justify-center transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:text-stone/50 disabled:hover:bg-transparent`}
      >
        <Plus className="size-3.5" strokeWidth={1.5} />
      </button>
    </div>
  );
}
