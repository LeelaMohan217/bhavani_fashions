"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { trackOrder } from "@/lib/store-actions";

export function TrackOrderForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const res = await trackOrder(String(form.get("number") ?? ""), String(form.get("phone") ?? ""));
      if (res.ok) {
        router.push(`/order/${res.orderId}`);
      } else {
        setError(res.fieldErrors ? null : res.error);
        setFieldErrors(res.fieldErrors ?? {});
      }
    });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="mt-12 max-w-xl space-y-6">
      <Field
        label="Order number"
        name="number"
        placeholder="e.g. BF10023"
        hint="You'll find it in your order confirmation."
        autoComplete="off"
        error={fieldErrors.number}
      />
      <Field
        label="Mobile number"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="10-digit mobile"
        hint="The number you used at checkout."
        error={fieldErrors.phone}
      />

      {error && (
        <p role="alert" className="text-sm text-clay">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="eyebrow group inline-flex h-14 items-center justify-center gap-3 bg-ink px-8 text-canvas transition-colors hover:bg-clay-deep disabled:opacity-70"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" strokeWidth={1.5} />
        ) : (
          <>
            Track order
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
          </>
        )}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  hint,
  error,
  ...input
}: { label: string; name: string; hint?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="eyebrow block text-ink-soft">
        {label}
      </label>
      <input
        id={name}
        name={name}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={`${name}-note`}
        className={`mt-2 h-12 w-full border-b bg-transparent text-base focus:outline-none ${
          error ? "border-clay" : "border-line focus:border-ink"
        }`}
        {...input}
      />
      <p id={`${name}-note`} className={`mt-2 text-xs ${error ? "text-clay" : "text-stone"}`}>
        {error ?? hint}
      </p>
    </div>
  );
}
