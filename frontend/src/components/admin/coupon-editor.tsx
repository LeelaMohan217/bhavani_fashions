"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Trash2, TriangleAlert } from "lucide-react";
import { deleteCoupon, saveCoupon } from "@/lib/admin/actions";
import type { AdminCoupon, CouponPayload, CouponType } from "@/lib/admin/types";
import { Select } from "@/components/ui/select";
import { Card, btn, inputCls } from "./ui";

/** Form state: money in rupees and dates as yyyy-mm-dd, as typed */
type Form = {
  code: string;
  description: string;
  type: CouponType;
  value: string;
  minOrder: string;
  maxDiscount: string;
  startsOn: string;
  endsOn: string;
  usageLimit: string;
  isActive: boolean;
};

/** yyyy-mm-dd in Indian time */
const istDay = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso)) : "";

const fromCoupon = (c?: AdminCoupon): Form => ({
  code: c?.code ?? "",
  description: c?.description ?? "",
  type: c?.type ?? "PERCENT",
  value: c ? String(c.type === "FLAT" ? c.value / 100 : c.value) : "",
  minOrder: c?.minOrder ? String(c.minOrder / 100) : "",
  maxDiscount: c?.maxDiscount ? String(c.maxDiscount / 100) : "",
  startsOn: istDay(c?.startsAt ?? null),
  endsOn: istDay(c?.endsAt ?? null),
  usageLimit: c?.usageLimit ? String(c.usageLimit) : "",
  isActive: c?.isActive ?? true,
});

const rupeesToPaise = (v: string) => Math.round(Number(v || 0) * 100);

function toPayload(f: Form): CouponPayload {
  return {
    code: f.code.trim(),
    description: f.description.trim() || null,
    type: f.type,
    value: f.type === "FLAT" ? rupeesToPaise(f.value) : Math.round(Number(f.value || 0)),
    minOrder: rupeesToPaise(f.minOrder),
    maxDiscount: f.type === "PERCENT" && f.maxDiscount ? rupeesToPaise(f.maxDiscount) : null,
    // Starts at the beginning of the chosen day and ends at its last second, Indian time
    startsAt: f.startsOn ? `${f.startsOn}T00:00:00+05:30` : null,
    endsAt: f.endsOn ? `${f.endsOn}T23:59:59+05:30` : null,
    usageLimit: f.usageLimit ? Math.round(Number(f.usageLimit)) : null,
    isActive: f.isActive,
  };
}

/** Create or edit a coupon code. */
export function CouponEditor({ coupon }: { coupon?: AdminCoupon }) {
  const router = useRouter();
  const [initial, setInitial] = useState(() => fromCoupon(coupon));
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, start] = useTransition();

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const used = coupon?.usedCount ?? 0;

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
    setErrors((e) => {
      const rest = { ...e };
      // Payload keys differ from form keys for the dates
      delete rest[key === "startsOn" ? "startsAt" : key === "endsOn" ? "endsAt" : key];
      return rest;
    });
  };

  const onSave = () => {
    setFormError(null);
    start(async () => {
      const res = await saveCoupon(coupon?.id ?? null, toPayload(form));
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.fieldErrors ? "Some details need fixing. See the highlighted fields." : res.error);
        return;
      }
      if (coupon) {
        const fresh = fromCoupon(res.coupon);
        setInitial(fresh);
        setForm(fresh);
        setSaved(true);
        router.refresh();
      } else {
        router.push("/admin/coupons");
        router.refresh();
      }
    });
  };

  const onDelete = () =>
    start(async () => {
      if (!coupon) return;
      const res = await deleteCoupon(coupon.id);
      if (!res.ok) {
        setFormError(res.error);
        setConfirmDelete(false);
        return;
      }
      router.push("/admin/coupons");
      router.refresh();
    });

  const input = (key: Exclude<keyof Form, "type" | "isActive">, errKey: string = key) => ({
    id: key,
    value: form[key],
    "aria-invalid": Boolean(errors[errKey]) || undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key, key === "code" ? e.target.value.toUpperCase() : e.target.value),
  });
  const err = (key: string) => (errors[key] ? <p className="mt-1 text-xs text-red-600">{errors[key]}</p> : null);

  const preview = previewLine(form);

  return (
    <div className="pb-24">
      {formError && (
        <div role="alert" className="mb-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" /> {formError}
        </div>
      )}

      <div className="grid max-w-3xl gap-4">
        <Card title="Code" bodyClassName="p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="code" hint="Shoppers type this">
                Code
              </Label>
              <input {...input("code")} placeholder="e.g. FESTIVE10" maxLength={20} disabled={used > 0} className={`${inputCls} font-medium uppercase tracking-wide disabled:bg-neutral-50 disabled:text-neutral-500`} />
              {err("code") ?? (used > 0 && <p className="mt-1 text-xs text-neutral-500">Used on {used} order{used === 1 ? "" : "s"}, so it can&rsquo;t be renamed.</p>)}
            </div>
            <div>
              <Label htmlFor="description" hint="Only the team sees this">
                Note
              </Label>
              <input {...input("description")} placeholder="e.g. Diwali Instagram post" maxLength={120} className={inputCls} />
              {err("description")}
            </div>
          </div>
        </Card>

        <Card title="Discount" bodyClassName="p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                id="type"
                tone="admin"
                value={form.type}
                onChange={(v) => set("type", v as CouponType)}
                options={[
                  { value: "PERCENT", label: "Percentage off" },
                  { value: "FLAT", label: "Fixed amount off" },
                ]}
                className={`${inputCls} flex items-center gap-2 text-left`}
              />
            </div>
            <div>
              <Label htmlFor="value">{form.type === "PERCENT" ? "Percent off" : "Amount off"}</Label>
              <Affix before={form.type === "FLAT" ? "₹" : undefined} after={form.type === "PERCENT" ? "%" : undefined} invalid={Boolean(errors.value)}>
                <input {...input("value")} inputMode="numeric" placeholder={form.type === "PERCENT" ? "10" : "200"} className={affixInput} />
              </Affix>
              {err("value")}
            </div>
            {form.type === "PERCENT" && (
              <div>
                <Label htmlFor="maxDiscount" hint="Optional">
                  Up to
                </Label>
                <Affix before="₹" invalid={Boolean(errors.maxDiscount)}>
                  <input {...input("maxDiscount")} inputMode="numeric" placeholder="No cap" className={affixInput} />
                </Affix>
                {err("maxDiscount")}
              </div>
            )}
            <div>
              <Label htmlFor="minOrder" hint="Optional">
                Minimum bag
              </Label>
              <Affix before="₹" invalid={Boolean(errors.minOrder)}>
                <input {...input("minOrder")} inputMode="numeric" placeholder="Any amount" className={affixInput} />
              </Affix>
              {err("minOrder")}
            </div>
          </div>
          {preview && <p className="mt-3 rounded-md bg-neutral-50 px-3 py-2 text-xs text-neutral-600">{preview}</p>}
        </Card>

        <Card title="Limits" bodyClassName="p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="startsOn" hint="Optional">
                Starts on
              </Label>
              <input {...input("startsOn", "startsAt")} type="date" className={inputCls} />
              {err("startsAt")}
            </div>
            <div>
              <Label htmlFor="endsOn" hint="Optional">
                Ends on
              </Label>
              <input {...input("endsOn", "endsAt")} type="date" min={form.startsOn || undefined} className={inputCls} />
              {err("endsAt")}
            </div>
            <div>
              <Label htmlFor="usageLimit" hint="Optional">
                Total uses
              </Label>
              <input {...input("usageLimit")} inputMode="numeric" placeholder="Unlimited" className={inputCls} />
              {err("usageLimit") ?? (coupon && <p className="mt-1 text-xs text-neutral-500">Used {used} so far</p>)}
            </div>
          </div>
          <p className="mt-2 text-xs text-neutral-500">Days follow Indian time. A use is counted once the order is confirmed; cancelling the order gives it back.</p>
        </Card>

        <Card bodyClassName="p-4">
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span>
              <span className="block text-sm font-medium">Code is on</span>
              <span className="block text-xs text-neutral-500">{form.isActive ? "Shoppers can use it within the dates above." : "Off: shoppers can't use it. Nothing is deleted."}</span>
            </span>
            <Switch on={form.isActive} label="Code is on" onClick={() => set("isActive", !form.isActive)} />
          </label>
        </Card>

        {coupon && (
          <Card bodyClassName="p-4">
            {used > 0 ? (
              <p className="text-sm text-neutral-600">This code has been used on orders, so it can&rsquo;t be deleted. Switch it off instead.</p>
            ) : confirmDelete ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-neutral-700">Delete {coupon.code} for good?</span>
                <button type="button" disabled={pending} onClick={onDelete} className={`${btn.base} ${btn.danger}`}>
                  {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Yes, delete
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className={`${btn.base} ${btn.ghost}`}>
                  Keep it
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className={`${btn.base} ${btn.danger}`}>
                <Trash2 className="size-4" /> Delete code
              </button>
            )}
          </Card>
        )}
      </div>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-[var(--bottom-nav-h,0px)] z-20 border-t border-neutral-200 bg-white/90 backdrop-blur transition-[left] duration-200 md:left-20 lg:left-[var(--sidebar-w,15rem)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 md:px-8">
          <p className="text-sm text-neutral-500" aria-live="polite">
            {pending ? (
              "Saving…"
            ) : dirty ? (
              <span className="inline-flex items-center gap-2 text-amber-700">
                <span className="size-1.5 rounded-full bg-amber-500" /> Unsaved changes
              </span>
            ) : saved ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <Check className="size-4" /> Saved
              </span>
            ) : coupon ? (
              "No changes"
            ) : (
              "New code"
            )}
          </p>
          <div className="flex gap-2">
            {dirty && coupon && (
              <button type="button" disabled={pending} onClick={() => setForm(initial)} className={`${btn.base} ${btn.ghost}`}>
                Discard
              </button>
            )}
            <button type="button" disabled={pending || (!dirty && Boolean(coupon))} onClick={onSave} className={`${btn.base} ${btn.primary}`}>
              {pending && <LoaderCircle className="size-4 animate-spin" />}
              {coupon ? "Save changes" : "Create code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Plain-language summary of what the code will do, e.g. "FESTIVE10 takes 10% off, up to ₹500, on bags of ₹2,000 or more." */
function previewLine(f: Form) {
  const v = Number(f.value);
  if (!f.code.trim() || !v) return null;
  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const off = f.type === "PERCENT" ? `${v}% off${Number(f.maxDiscount) ? ` (up to ${inr(Number(f.maxDiscount))})` : ""}` : `${inr(v)} off`;
  const min = Number(f.minOrder) ? ` on bags of ${inr(Number(f.minOrder))} or more` : " on any bag";
  return `${f.code.trim()} takes ${off}${min}.`;
}

const affixInput = "h-9 min-w-0 flex-1 bg-transparent px-2 text-sm tabular-nums focus:outline-none";

function Affix({ before, after, invalid, children }: { before?: string; after?: string; invalid?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`flex items-center rounded-md border bg-white shadow-xs focus-within:border-neutral-900 focus-within:ring-2 focus-within:ring-neutral-900/10 ${
        invalid ? "border-red-300" : "border-neutral-200"
      }`}
    >
      {before && <span className="shrink-0 pl-3 text-sm text-neutral-400">{before}</span>}
      {children}
      {after && <span className="shrink-0 pr-3 text-sm text-neutral-400">{after}</span>}
    </div>
  );
}

export function Switch({ on, label, onClick, disabled }: { on: boolean; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${on ? "bg-neutral-900" : "bg-neutral-200"}`}
    >
      <span className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${on ? "translate-x-[1.125rem]" : "translate-x-0.5"}`} />
    </button>
  );
}

function Label({ htmlFor, hint, children }: { htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 flex items-baseline justify-between text-sm font-medium text-neutral-800">
      {children}
      {hint && <span className="text-xs font-normal text-neutral-400">{hint}</span>}
    </label>
  );
}
