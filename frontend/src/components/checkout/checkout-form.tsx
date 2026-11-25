"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  ChevronDown,
  CreditCard,
  Landmark,
  LoaderCircle,
  Lock,
  ShieldCheck,
  Smartphone,
  Tag,
} from "lucide-react";
import { applyCoupon, placeOrder, verifyPayment, type CheckoutForm as FormValues } from "@/lib/cart-actions";
import { formatPrice } from "@/lib/format";
import { Select } from "@/components/ui/select";
import { INDIAN_STATES } from "@/lib/india";
import type { AppliedCoupon, Cart, CheckoutConfig, PaymentMethod } from "@/lib/types";
import { useCart } from "../cart/cart-provider";
import { openRazorpay } from "./razorpay";
import { CheckoutSkeleton } from "../skeletons";

type Errors = Partial<Record<keyof FormValues, string>>;

const EMPTY: Omit<FormValues, "paymentMethod"> = {
  email: "",
  phone: "",
  fullName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
};

export function CheckoutForm({ config }: { config: CheckoutConfig }) {
  const router = useRouter();
  const { cart, loading, refresh } = useCart();
  const [values, setValues] = useState(EMPTY);
  const [method, setMethod] = useState<PaymentMethod>(config.razorpayEnabled ? "RAZORPAY" : "COD");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [stage, setStage] = useState<"idle" | "placing" | "paying" | "verifying">("idle");
  const formRef = useRef<HTMLFormElement>(null);

  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);

  const busy = stage !== "idle";
  const codFee = method === "COD" ? config.codFee : 0;
  const discount = coupon?.discount ?? 0;
  const total = (cart?.subtotal ?? 0) - discount + config.shippingFee + codFee;
  const couponProps = { coupon, onApply: setCoupon, onRemove: () => setCoupon(null), disabled: busy };

  const set = (name: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const focusFirstError = (errs: Errors) => {
    const first = Object.keys(errs)[0];
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setErrors({});
    setStage("placing");

    const res = await placeOrder({ ...values, paymentMethod: method, couponCode: coupon?.code });
    if (!res.ok) {
      setStage("idle");
      setFormError(res.fieldErrors ? "Please check the highlighted details." : res.error);
      if (res.fieldErrors) {
        setErrors(res.fieldErrors as Errors);
        focusFirstError(res.fieldErrors as Errors);
      }
      return;
    }

    if (!res.razorpay) {
      await refresh();
      router.push(`/order/${res.orderId}`);
      return;
    }

    try {
      setStage("paying");
      const payment = await openRazorpay(res.razorpay);
      if (!payment) {
        setStage("idle");
        setFormError("Payment was cancelled. Your bag is saved, so you can try again whenever you're ready.");
        return;
      }
      setStage("verifying");
      const verified = await verifyPayment({
        orderId: res.orderId,
        razorpayOrderId: payment.razorpay_order_id,
        razorpayPaymentId: payment.razorpay_payment_id,
        razorpaySignature: payment.razorpay_signature,
      });
      await refresh();
      if (!verified.ok) {
        setStage("idle");
        setFormError(verified.error);
        return;
      }
      router.push(`/order/${verified.orderId}`);
    } catch (err) {
      setStage("idle");
      setFormError(err instanceof Error ? err.message : "Payment could not be started. Please try again.");
    }
  }

  if (loading) return <CheckoutSkeleton />;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <p className="eyebrow text-clay">Checkout</p>
        <h1 className="display mt-5 text-5xl">Your bag is empty</h1>
        <p className="mt-4 text-sm text-stone">Add a piece or two, then come back to check out.</p>
        <Link
          href="/shop"
          className="eyebrow mt-10 inline-flex items-center gap-3 bg-ink px-7 py-4 text-canvas transition-colors hover:bg-clay-deep"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  const blocked = cart.items.some((i) => i.unavailable);

  return (
    <div className="container-x pb-10 pt-8 md:pt-14">
      <Link href="/bag" className="eyebrow inline-flex items-center gap-2 text-stone hover:text-ink">
        <ArrowLeft className="size-3.5" strokeWidth={1.5} /> Back to bag
      </Link>
      <h1 className="display mt-6 text-[3rem] md:text-[4.5rem]">Checkout</h1>

      {/* Mobile summary toggle */}
      <details className="group mt-8 border-y border-line lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between py-4">
          <span className="eyebrow inline-flex items-center gap-2">
            Order summary
            <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" strokeWidth={1.5} />
          </span>
          <span className="display text-xl tabular-nums">{formatPrice(total)}</span>
        </summary>
        <div className="pb-6">
          <Summary cart={cart} codFee={codFee} total={total} {...couponProps} />
        </div>
      </details>

      <div className="mt-8 grid gap-14 lg:mt-12 lg:grid-cols-12 lg:gap-16">
        <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-14 lg:col-span-7">
          <Section index="01" title="Contact">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Email" name="email" type="email" autoComplete="email" inputMode="email"
                value={values.email} onChange={set("email")} error={errors.email} required />
              <Field label="Mobile number" name="phone" type="tel" autoComplete="tel" inputMode="tel"
                placeholder="10-digit mobile" value={values.phone} onChange={set("phone")} error={errors.phone}
                hint="For delivery updates" required />
            </div>
          </Section>

          <Section index="02" title="Delivery address">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field className="sm:col-span-2" label="Full name" name="fullName" autoComplete="name"
                value={values.fullName} onChange={set("fullName")} error={errors.fullName} required />
              <Field className="sm:col-span-2" label="House no., building, street" name="addressLine1"
                autoComplete="address-line1" value={values.addressLine1} onChange={set("addressLine1")}
                error={errors.addressLine1} required />
              <Field className="sm:col-span-2" label="Area, landmark (optional)" name="addressLine2"
                autoComplete="address-line2" value={values.addressLine2 ?? ""} onChange={set("addressLine2")}
                error={errors.addressLine2} />
              <Field label="City" name="city" autoComplete="address-level2" value={values.city}
                onChange={set("city")} error={errors.city} required />
              <Field label="PIN code" name="pincode" autoComplete="postal-code" inputMode="numeric" maxLength={6}
                value={values.pincode} onChange={set("pincode")} error={errors.pincode} required />
              <div className="sm:col-span-2">
                <label htmlFor="state" className="eyebrow text-stone">State</label>
                <div className="relative mt-2">
                  <Select
                    id="state"
                    name="state"
                    value={values.state}
                    onChange={(v) => {
                      setValues((cur) => ({ ...cur, state: v }));
                      if (errors.state) setErrors((er) => ({ ...er, state: undefined }));
                    }}
                    options={INDIAN_STATES.map((st) => ({ value: st, label: st }))}
                    placeholder="Select your state"
                    invalid={Boolean(errors.state)}
                    describedBy={errors.state ? "state-error" : undefined}
                    className={`flex h-12 w-full items-center gap-3 border bg-transparent px-4 text-sm transition-colors focus:border-ink focus:outline-none aria-expanded:border-ink ${
                      errors.state ? "border-clay" : "border-line"
                    } ${values.state ? "text-ink" : "text-stone"}`}
                  />
                </div>
                {errors.state && <p id="state-error" className="mt-1.5 text-xs text-clay">{errors.state}</p>}
              </div>
            </div>
          </Section>

          <Section index="03" title="Payment">
            <div role="radiogroup" aria-label="Payment method" className="space-y-3">
              <PaymentOption
                checked={method === "RAZORPAY"}
                disabled={!config.razorpayEnabled}
                onSelect={() => setMethod("RAZORPAY")}
                title="Pay online"
                subtitle={
                  config.razorpayEnabled
                    ? "UPI, cards, net banking and wallets, secured by Razorpay"
                    : "Online payment is coming soon"
                }
                icons={[Smartphone, CreditCard, Landmark]}
              />
              <PaymentOption
                checked={method === "COD"}
                onSelect={() => setMethod("COD")}
                title="Cash on delivery"
                subtitle={`Pay in cash or UPI when your order arrives · +${formatPrice(config.codFee)}`}
                icons={[Banknote]}
              />
            </div>
          </Section>

          <div className="border-t border-line pt-8">
            {formError && (
              <p role="alert" className="mb-5 border-l-2 border-clay bg-clay/5 px-4 py-3 text-sm text-ink-soft">
                {formError}
              </p>
            )}
            <button
              type="submit"
              disabled={busy || blocked}
              className="eyebrow flex h-16 w-full items-center justify-center gap-3 bg-ink text-canvas transition-colors hover:bg-clay-deep disabled:cursor-not-allowed disabled:bg-stone"
            >
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" strokeWidth={1.5} />
              ) : (
                <Lock className="size-3.5" strokeWidth={1.5} />
              )}
              {stage === "placing"
                ? "Placing your order…"
                : stage === "paying"
                  ? "Waiting for payment…"
                  : stage === "verifying"
                    ? "Confirming payment…"
                    : method === "COD"
                      ? `Place order · ${formatPrice(total)}`
                      : `Pay ${formatPrice(total)} securely`}
            </button>
            {blocked && (
              <p className="mt-3 text-xs text-clay">
                Some pieces in your bag are no longer available. <Link href="/bag" className="underline">Review your bag</Link>.
              </p>
            )}
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-stone">
              <ShieldCheck className="size-3.5" strokeWidth={1.5} />
              Your details are encrypted and never shared.
            </p>
          </div>
        </form>

        <aside className="hidden lg:col-span-5 lg:block">
          <div className="sticky top-28 bg-sand p-8">
            <h2 className="eyebrow">Order summary</h2>
            <div className="mt-6">
              <Summary cart={cart} codFee={codFee} total={total} {...couponProps} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ index, title, children }: { index: string; title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="flex w-full items-baseline gap-4 border-b border-line pb-4">
        <span className="eyebrow text-clay">{index}</span>
        <span className="display text-3xl">{title}</span>
      </legend>
      <div className="mt-7">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  name,
  error,
  hint,
  className = "",
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; error?: string; hint?: string }) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={name} className="eyebrow flex justify-between text-stone">
        {label}
        {hint && !error && <span id={`${name}-hint`} className="normal-case tracking-normal text-stone/80">{hint}</span>}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`mt-2 h-12 w-full border bg-transparent px-4 text-sm text-ink transition-colors placeholder:text-stone/60 focus:border-ink focus:outline-none ${
          error ? "border-clay" : "border-line"
        }`}
        {...input}
      />
      {error && <p id={`${name}-error`} className="mt-1.5 text-xs text-clay">{error}</p>}
    </div>
  );
}

function PaymentOption({
  checked,
  disabled = false,
  onSelect,
  title,
  subtitle,
  icons,
}: {
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
  icons: React.ComponentType<{ className?: string; strokeWidth?: number }>[];
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={`${title}. ${subtitle}`}
      disabled={disabled}
      onClick={onSelect}
      className={`flex w-full items-center gap-4 border p-5 text-left transition-colors ${
        checked ? "border-ink bg-canvas" : "border-line hover:border-stone"
      } disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line`}
    >
      <span
        className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${checked ? "border-ink" : "border-stone/50"}`}
        aria-hidden
      >
        {checked && <span className="size-2.5 rounded-full bg-ink" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-xs text-stone">{subtitle}</span>
      </span>
      <span className="hidden gap-2 text-stone sm:flex">
        {icons.map((Icon, i) => (
          <Icon key={i} className="size-4" strokeWidth={1.5} />
        ))}
      </span>
    </button>
  );
}

type CouponProps = {
  coupon: AppliedCoupon | null;
  onApply: (c: AppliedCoupon) => void;
  onRemove: () => void;
  disabled: boolean;
};

/** "Have a code?" link that opens into a slim input with Apply; once applied, shows the code with Remove. */
function CouponField({ coupon, onApply, onRemove, disabled }: CouponProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-3 border border-dashed border-ink/25 px-3 py-2 text-sm">
        <span className="inline-flex min-w-0 items-center gap-2">
          <Tag className="size-3.5 shrink-0 text-clay" strokeWidth={1.5} />
          <span className="font-medium tracking-wide">{coupon.code}</span>
          <span className="truncate text-xs text-stone">{coupon.label}</span>
        </span>
        <button type="button" disabled={disabled} onClick={onRemove} className="text-xs text-stone underline-offset-2 hover:text-ink hover:underline">
          Remove
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 text-xs text-ink-soft underline-offset-2 hover:text-ink hover:underline">
        <Tag className="size-3.5" strokeWidth={1.5} /> Have a discount code?
      </button>
    );
  }

  const apply = () => {
    if (!code.trim()) return;
    setError(null);
    start(async () => {
      const res = await applyCoupon(code.trim());
      if (res.ok) {
        onApply(res.coupon);
        setCode("");
        setOpen(false);
      } else setError(res.error);
    });
  };

  return (
    <div>
      <div className="flex">
        <label htmlFor="coupon" className="sr-only">
          Discount code
        </label>
        <input
          id="coupon"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={(e) => {
            // Enter applies the code instead of submitting the whole checkout form
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          autoFocus
          autoComplete="off"
          placeholder="Discount code"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "coupon-error" : undefined}
          className={`h-10 min-w-0 flex-1 border border-r-0 bg-transparent px-3 text-sm uppercase tracking-wide placeholder:normal-case placeholder:tracking-normal placeholder:text-stone/60 focus:border-ink focus:outline-none ${
            error ? "border-clay" : "border-line"
          }`}
        />
        <button
          type="button"
          onClick={apply}
          disabled={pending || disabled || !code.trim()}
          className="eyebrow inline-flex h-10 items-center gap-2 bg-ink px-4 text-canvas transition-colors hover:bg-clay-deep disabled:bg-stone"
        >
          {pending && <LoaderCircle className="size-3.5 animate-spin" strokeWidth={1.5} />}
          Apply
        </button>
      </div>
      {error && (
        <p id="coupon-error" role="alert" className="mt-1.5 text-xs text-clay">
          {error}
        </p>
      )}
    </div>
  );
}

function Summary({ cart, codFee, total, ...couponProps }: { cart: Cart; codFee: number; total: number } & CouponProps) {
  const { coupon } = couponProps;
  return (
    <>
      <ul className="space-y-5">
        {cart.items.map((item) => (
          <li key={item.id} className="flex gap-4">
            <div className="relative aspect-[3/4] w-16 shrink-0 bg-canvas">
              {item.image && (
                <Image src={item.image.url} alt={item.image.alt} fill sizes="64px" className="object-cover" />
              )}
              <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-ink text-[0.6rem] text-canvas tabular-nums">
                {item.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display leading-snug">{item.productName}</p>
              <p className="mt-0.5 text-xs text-stone">
                {item.color}
                {item.size && ` · Size ${item.size}`}
              </p>
              {item.unavailable && <p className="mt-1 text-xs text-clay">No longer available in this quantity</p>}
            </div>
            <p className="text-sm tabular-nums">{formatPrice(item.lineTotal)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-ink/10 pt-5">
        <CouponField {...couponProps} />
      </div>

      <dl className="mt-5 space-y-3 border-t border-ink/10 pt-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-soft">Subtotal</dt>
          <dd className="tabular-nums">{formatPrice(cart.subtotal)}</dd>
        </div>
        {coupon && (
          <div className="flex justify-between">
            <dt className="text-ink-soft">Discount · {coupon.code}</dt>
            <dd className="tabular-nums text-clay">−{formatPrice(coupon.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-ink-soft">Shipping</dt>
          <dd className="text-clay">Free</dd>
        </div>
        {codFee > 0 && (
          <div className="flex justify-between">
            <dt className="text-ink-soft">Cash on delivery fee</dt>
            <dd className="tabular-nums">{formatPrice(codFee)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-ink/10 pt-4">
          <dt className="font-medium">Total</dt>
          <dd className="display text-3xl tabular-nums">{formatPrice(total)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-right text-xs text-stone">Inclusive of all taxes</p>
    </>
  );
}
