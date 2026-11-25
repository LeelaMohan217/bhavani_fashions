"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Percent, TriangleAlert } from "lucide-react";
import { savePromotion } from "@/lib/admin/actions";
import type { AdminPromotion } from "@/lib/admin/types";
import { Select } from "@/components/ui/select";
import { pad, useCountdown } from "@/components/promo/countdown";
import { useFeedback } from "@/components/ui/feedback";
import { useUnsavedGuard } from "./use-unsaved-guard";
import { Badge, Card, btn, inputCls } from "./ui";

const IST = "Asia/Kolkata";

/** "2026-11-27" and "23:59" for an instant, in India time */
function istParts(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

const dayLabel = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/** Today and the next 60 days, in India time */
function dateOptions(keep?: string) {
  const today = istParts(new Date().toISOString()).date;
  const start = new Date(`${today}T00:00:00Z`).getTime();
  const days = Array.from({ length: 61 }, (_, i) => new Date(start + i * 86_400_000).toISOString().slice(0, 10));
  if (keep && !days.includes(keep)) days.unshift(keep);
  return days.map((d) => ({ value: d, label: dayLabel.format(new Date(`${d}T00:00:00Z`)) }));
}

const timeLabel = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  if (t === "23:59") return "11:59 pm (end of day)";
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? "am" : "pm"}`;
};
const TIMES = [...Array.from({ length: 48 }, (_, i) => `${pad(Math.floor(i / 2))}:${i % 2 ? "30" : "00"}`), "23:59"].map((t) => ({
  value: t,
  label: timeLabel(t),
}));

/** Store-wide % off: switch, %, and when it ends. Prices change everywhere the moment it's saved. */
export function PromotionCard({ promotion }: { promotion: AdminPromotion | null }) {
  const router = useRouter();
  const start = promotion
    ? { name: promotion.name, percentOff: String(promotion.percentOff), ...istParts(promotion.endsAt), isActive: promotion.isActive }
    : { name: "Black Friday", percentOff: "30", date: istParts(new Date().toISOString()).date, time: "23:59", isActive: false };
  const [saved, setSaved] = useState(start);
  const [form, setForm] = useState(start);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, run] = useTransition();
  const { confirm } = useFeedback();

  const endsAt = `${saved.date}T${saved.time}:${saved.time === "23:59" ? "59" : "00"}+05:30`;
  const t = useCountdown(endsAt);
  const running = saved.isActive && t !== null && !t.ended;
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  useUnsavedGuard(dirty && !pending);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDone(false);
  };

  const onSave = async () => {
    setError(null);
    setErrors({});
    const pct = Number(form.percentOff);
    if (!Number.isInteger(pct) || pct < 1 || pct > 90) {
      setErrors({ percentOff: "Enter a whole number from 1 to 90" });
      return;
    }
    const payload = {
      name: form.name.trim(),
      percentOff: pct,
      endsAt: `${form.date}T${form.time}:${form.time === "23:59" ? "59" : "00"}+05:30`,
      isActive: form.isActive,
    };
    if (payload.isActive && new Date(payload.endsAt) <= new Date()) {
      setErrors({ endsAt: "This time has already passed. Choose a later end." });
      return;
    }
    // Prices change across the whole store, so ask when the offer starts, changes % or ends early
    const starting = payload.isActive && (!running || String(pct) !== saved.percentOff);
    const ending = !payload.isActive && running;
    if (starting || ending) {
      const ends = `${dayLabel.format(new Date(`${form.date}T00:00:00Z`))}, ${timeLabel(form.time)}`;
      const ok = await confirm(
        starting
          ? {
              title: `Start ${pct}% off everything?`,
              body: `Every price in the store drops by ${pct}% straight away, until ${ends}.`,
              confirmLabel: "Start offer",
            }
          : {
              title: "End the offer now?",
              body: "Every price in the store goes back to full price straight away.",
              confirmLabel: "End offer",
              danger: true,
            },
      );
      if (!ok) return;
    }
    run(async () => {
      const res = await savePromotion(payload);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setError(res.fieldErrors ? null : res.error);
        return;
      }
      setSaved(form);
      setDone(true);
      router.refresh();
    });
  };

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <Percent className="size-4 text-neutral-500" /> Store-wide offer
        </span>
      }
      action={
        running ? (
          <Badge tone="green" dot>
            Running · {t.days > 0 ? `${t.days}d ` : ""}
            {pad(t.hours)}h {pad(t.minutes)}m left
          </Badge>
        ) : saved.isActive && t?.ended ? (
          <Badge dot>Ended</Badge>
        ) : (
          <Badge dot>Off</Badge>
        )
      }
    >
      <p className="text-sm text-neutral-600">
        Takes a % off every product in the shop, cart and checkout, and adds a countdown banner and top bar. Product prices aren&rsquo;t
        changed: when the offer ends they go back to normal by themselves.
      </p>

      {error && (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" /> {error}
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <div>
          <label htmlFor="promo-name" className="mb-1.5 block text-sm font-medium text-neutral-800">
            Name shoppers see
          </label>
          <input id="promo-name" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} maxLength={40} />
          {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="promo-pct" className="mb-1.5 block text-sm font-medium text-neutral-800">
            Discount
          </label>
          <div className="relative">
            <input
              id="promo-pct"
              type="number"
              inputMode="numeric"
              min={1}
              max={90}
              value={form.percentOff}
              onChange={(e) => set("percentOff", e.target.value)}
              aria-invalid={Boolean(errors.percentOff) || undefined}
              className={`${inputCls} pr-14 tabular-nums`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">% off</span>
          </div>
          {errors.percentOff && <p className="mt-1.5 text-xs text-red-600">{errors.percentOff}</p>}
        </div>
        <div>
          <label htmlFor="promo-date" className="mb-1.5 block text-sm font-medium text-neutral-800">
            Ends on
          </label>
          <Select
            id="promo-date"
            tone="admin"
            value={form.date}
            onChange={(v) => set("date", v)}
            options={dateOptions(form.date)}
            className={`${inputCls} flex items-center gap-2 text-left`}
          />
        </div>
        <div>
          <label htmlFor="promo-time" className="mb-1.5 block text-sm font-medium text-neutral-800">
            At (India time)
          </label>
          <Select
            id="promo-time"
            tone="admin"
            value={form.time}
            onChange={(v) => set("time", v)}
            options={TIMES}
            minListWidth={190}
            className={`${inputCls} flex items-center gap-2 text-left`}
          />
        </div>
      </div>
      {errors.endsAt && <p className="mt-2 text-xs text-red-600">{errors.endsAt}</p>}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4">
        <label className="flex cursor-pointer items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={form.isActive}
            aria-label="Offer switched on"
            onClick={() => set("isActive", !form.isActive)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${form.isActive ? "bg-neutral-900" : "bg-neutral-200"}`}
          >
            <span className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${form.isActive ? "translate-x-[1.125rem]" : "translate-x-0.5"}`} />
          </button>
          <span className="text-sm font-medium">{form.isActive ? "On" : "Off"}</span>
        </label>
        <div className="flex items-center gap-3">
          <span className="text-sm" aria-live="polite">
            {pending ? (
              <span className="text-neutral-500">Saving…</span>
            ) : dirty ? (
              <span className="inline-flex items-center gap-2 text-amber-700">
                <span className="size-1.5 rounded-full bg-amber-500" /> Unsaved
              </span>
            ) : done ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <Check className="size-4" /> Saved. Prices are updated.
              </span>
            ) : null}
          </span>
          <button type="button" disabled={pending || !dirty} onClick={onSave} className={`${btn.base} ${btn.primary}`}>
            {pending && <LoaderCircle className="size-4 animate-spin" />}
            Save offer
          </button>
        </div>
      </div>
    </Card>
  );
}
