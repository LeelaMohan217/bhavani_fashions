"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Monitor, Smartphone, Trash2, TriangleAlert } from "lucide-react";
import { deleteBanner, saveBanner } from "@/lib/admin/actions";
import type { AdminBanner, BannerPayload } from "@/lib/admin/types";
import { BannerSlide } from "@/components/home/banner-slide";
import { SuggestInput } from "@/components/ui/suggest-input";
import { Card, btn, inputCls } from "./ui";

// Must match the API and images.remotePatterns in next.config.ts
const IMAGE_HOSTS = ["images.unsplash.com", "res.cloudinary.com"];
/** Photos shipped with the storefront in public/banners */
const STORE_PHOTO = /^\/banners\/[a-z0-9-]+\.(?:jpe?g|png)$/i;
const STORE_PHOTOS = ["/banners/navy-silk-saree.jpg", "/banners/pink-half-saree.jpg", "/banners/festive-silk-sarees.jpg"];

/** Pages a banner button usually points to */
const LINKS = ["/shop", "/shop/sarees", "/shop/lehengas", "/shop/kurta-sets", "/shop?filter=new", "/shop?filter=sale"];

const EMPTY: BannerPayload = {
  eyebrow: "",
  title: "",
  highlight: "",
  subtitle: "",
  ctaLabel: "Shop now",
  ctaHref: "/shop",
  imageUrl: "",
  imageAlt: "",
  textSide: "LEFT",
  isActive: true,
};

const fromBanner = (b: AdminBanner): BannerPayload => ({
  eyebrow: b.eyebrow ?? "",
  title: b.title,
  highlight: b.highlight ?? "",
  subtitle: b.subtitle ?? "",
  ctaLabel: b.ctaLabel,
  ctaHref: b.ctaHref,
  imageUrl: b.imageUrl,
  imageAlt: b.imageAlt,
  textSide: b.textSide,
  isActive: b.isActive,
});

function imageProblem(url: string): string | null {
  if (!url.trim()) return null;
  if (url.trim().startsWith("/")) {
    return STORE_PHOTO.test(url.trim()) ? null : "Store photos look like /banners/navy-silk-saree.jpg";
  }
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "https:") return "The link must start with https://";
    if (!IMAGE_HOSTS.includes(u.hostname)) return `For now, images must come from ${IMAGE_HOSTS.join(" or ")}.`;
    return null;
  } catch {
    return "That doesn't look like a link. Copy the image address and paste it here.";
  }
}

export function BannerEditor({ banner }: { banner?: AdminBanner }) {
  const router = useRouter();
  // What's saved on the server; compared with the form to show "Unsaved changes"
  const [initial, setInitial] = useState<BannerPayload>(() => (banner ? fromBanner(banner) : EMPTY));
  const [form, setForm] = useState<BannerPayload>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const [view, setView] = useState<"phone" | "desktop">("phone");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const set = <K extends keyof BannerPayload>(key: K, value: BannerPayload[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
    if (errors[key])
      setErrors((e) => {
        const rest = { ...e };
        delete rest[key];
        return rest;
      });
  };
  const field = (key: "eyebrow" | "title" | "highlight" | "subtitle" | "ctaLabel" | "imageAlt" | "imageUrl") => ({
    id: key,
    value: form[key],
    "aria-invalid": Boolean(errors[key]) || undefined,
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key, e.target.value),
  });
  const err = (key: string) =>
    errors[key] ? (
      <p id={`${key}-error`} className="mt-1.5 text-xs text-red-600">
        {errors[key]}
      </p>
    ) : null;

  const imgProblem = imageProblem(form.imageUrl);
  const previewUrl = form.imageUrl && !imgProblem ? form.imageUrl.trim() : "";

  const onSave = () => {
    setFormError(null);
    const local: Record<string, string> = {};
    if (form.title.trim().length < 2) local.title = "Add a headline";
    if (!form.imageUrl.trim()) local.imageUrl = "Add a photo link";
    else if (imgProblem) local.imageUrl = imgProblem;
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }
    const payload = { ...form, imageUrl: form.imageUrl.trim() };
    start(async () => {
      const res = await saveBanner(banner?.id ?? null, payload);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.fieldErrors ? "Some details need fixing. See the highlighted fields." : res.error);
        return;
      }
      if (banner) {
        setInitial(payload);
        setForm(payload);
        setSaved(true);
        router.refresh();
      } else {
        router.push("/admin/banners");
        router.refresh();
      }
    });
  };

  const onDelete = () =>
    start(async () => {
      if (!banner) return;
      const res = await deleteBanner(banner.id);
      if (!res.ok) {
        setFormError(res.error);
        setConfirmDelete(false);
        return;
      }
      router.push("/admin/banners");
      router.refresh();
    });

  return (
    <div className="pb-28">
      {formError && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" /> {formError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
        <div className="min-w-0 space-y-6">
          <Card title="Photo">
            <div className="space-y-4">
              <div>
                <Label htmlFor="imageUrl">Photo link</Label>
                <SuggestInput
                  id="imageUrl"
                  value={form.imageUrl}
                  onChange={(e) => set("imageUrl", e.target.value)}
                  onPick={(v) => set("imageUrl", v)}
                  suggestions={STORE_PHOTOS}
                  placeholder="/banners/navy-silk-saree.jpg or https://images.unsplash.com/…"
                  aria-invalid={Boolean(errors.imageUrl) || undefined}
                  className={inputCls}
                />
                {err("imageUrl") ??
                  (imgProblem ? (
                    <p className="mt-1.5 text-xs text-amber-700">{imgProblem}</p>
                  ) : (
                    <p className="mt-1.5 text-xs text-neutral-500">
                      Pick a store photo or paste a link. Wide photos work best. On phones the middle of the photo shows,
                      with the text at the bottom.
                    </p>
                  ))}
              </div>
              <div>
                <span className="mb-1.5 block text-sm font-medium text-neutral-800">Text sits on</span>
                <div role="radiogroup" aria-label="Text sits on" className="inline-flex rounded-md bg-neutral-100 p-0.5 text-xs font-medium">
                  {(
                    [
                      ["LEFT", "Left"],
                      ["RIGHT", "Right"],
                    ] as const
                  ).map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      role="radio"
                      aria-checked={form.textSide === v}
                      onClick={() => set("textSide", v)}
                      className={`rounded px-3 py-1.5 ${form.textSide === v ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-500 hover:text-neutral-900"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-neutral-500">On computers and tablets. Choose the side without the model.</p>
              </div>
              <div>
                <Label htmlFor="imageAlt" hint="Optional">
                  Photo description
                </Label>
                <input {...field("imageAlt")} placeholder="e.g. Woman in a red Kanjivaram silk saree" className={inputCls} />
                <p className="mt-1.5 text-xs text-neutral-500">Read aloud to shoppers who use a screen reader.</p>
              </div>
            </div>
          </Card>

          <Card title="Text">
            <div className="space-y-4">
              <div>
                <Label htmlFor="eyebrow" hint="Optional">
                  Small label
                </Label>
                <input {...field("eyebrow")} placeholder="e.g. The Festive Edit" className={inputCls} />
                {err("eyebrow")}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="title">Headline</Label>
                  <input {...field("title")} placeholder="e.g. Silk sarees," className={inputCls} />
                  {err("title")}
                </div>
                <div>
                  <Label htmlFor="highlight" hint="Optional, in italics">
                    Headline ending
                  </Label>
                  <input {...field("highlight")} placeholder="e.g. up to 20% off" className={`${inputCls} italic`} />
                  {err("highlight")}
                </div>
              </div>
              <div>
                <Label htmlFor="subtitle" hint="Optional">
                  Line under the headline
                </Label>
                <textarea {...field("subtitle")} rows={2} placeholder="e.g. Kanjivaram, Banarasi and Patola silks. This week only." className={`${inputCls} h-auto py-2`} />
                {err("subtitle")}
              </div>
            </div>
          </Card>

          <Card title="Button">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ctaLabel">Button text</Label>
                <input {...field("ctaLabel")} placeholder="e.g. Shop sarees" className={inputCls} />
                {err("ctaLabel")}
              </div>
              <div>
                <Label htmlFor="ctaHref">Opens</Label>
                <SuggestInput
                  id="ctaHref"
                  value={form.ctaHref}
                  onChange={(e) => set("ctaHref", e.target.value)}
                  onPick={(v) => set("ctaHref", v)}
                  suggestions={LINKS}
                  placeholder="/shop/sarees"
                  aria-invalid={Boolean(errors.ctaHref) || undefined}
                  className={`${inputCls} font-mono text-xs`}
                />
                {err("ctaHref") ?? <p className="mt-1.5 text-xs text-neutral-500">A page on your store, starting with /</p>}
              </div>
            </div>
          </Card>

          <Card title="Visibility">
            <label className="flex cursor-pointer items-start justify-between gap-4">
              <span>
                <span className="block text-sm font-medium">Show on home page</span>
                <span className="mt-0.5 block text-xs text-neutral-500">
                  {form.isActive ? "Shoppers see this banner in the slideshow." : "Hidden. Turn on when the offer starts."}
                </span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={form.isActive}
                aria-label="Show on home page"
                onClick={() => set("isActive", !form.isActive)}
                className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${form.isActive ? "bg-neutral-900" : "bg-neutral-200"}`}
              >
                <span className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${form.isActive ? "translate-x-[1.125rem]" : "translate-x-0.5"}`} />
              </button>
            </label>
          </Card>

          {banner && (
            <Card title="Delete banner">
              {confirmDelete ? (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-700">Delete this banner for good? To take it down for now, turn off “Show on home page” instead.</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={pending} onClick={onDelete} className={`${btn.base} ${btn.danger}`}>
                      {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Yes, delete
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(false)} className={`${btn.base} ${btn.ghost}`}>
                      Keep it
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className={`${btn.base} ${btn.danger}`}>
                  <Trash2 className="size-4" /> Delete banner
                </button>
              )}
            </Card>
          )}
        </div>

        {/* Live preview, exactly as the home page draws it */}
        <div className="min-w-0 lg:sticky lg:top-20">
          <Card
            title="Preview"
            action={
              <div role="group" aria-label="Preview size" className="inline-flex rounded-md bg-neutral-100 p-0.5 text-xs font-medium">
                {(
                  [
                    ["phone", "Phone", Smartphone],
                    ["desktop", "Computer", Monitor],
                  ] as const
                ).map(([v, label, Icon]) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={view === v}
                    onClick={() => setView(v)}
                    className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 ${view === v ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-500 hover:text-neutral-900"}`}
                  >
                    <Icon className="size-3.5" /> {label}
                  </button>
                ))}
              </div>
            }
          >
            <div className={view === "phone" ? "mx-auto max-w-[320px]" : ""}>
              <BannerSlide banner={{ ...form, imageUrl: previewUrl }} layout={view} preview />
            </div>
            {!form.isActive && <p className="mt-3 text-xs text-amber-700">Hidden: shoppers won&rsquo;t see this banner until you turn it on.</p>}
          </Card>
        </div>
      </div>

      {/* Sticky save bar (sits above the phone tab bar) */}
      <div className="fixed inset-x-0 bottom-[var(--bottom-nav-h,0px)] z-20 border-t border-neutral-200 bg-white/90 backdrop-blur transition-[left] duration-200 md:left-20 lg:left-[var(--sidebar-w,15rem)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <p className="text-sm text-neutral-500" aria-live="polite">
            {pending ? (
              "Saving…"
            ) : dirty ? (
              <span className="inline-flex items-center gap-2 text-amber-700">
                <span className="size-1.5 rounded-full bg-amber-500" /> Unsaved changes
              </span>
            ) : saved ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <Check className="size-4" /> Saved. The home page is updated.
              </span>
            ) : banner ? (
              "No changes"
            ) : (
              "New banner"
            )}
          </p>
          <div className="flex gap-2">
            {dirty && banner && (
              <button type="button" disabled={pending} onClick={() => setForm(initial)} className={`${btn.base} ${btn.ghost}`}>
                Discard
              </button>
            )}
            <button type="button" disabled={pending || (!dirty && Boolean(banner))} onClick={onSave} className={`${btn.base} ${btn.primary}`}>
              {pending && <LoaderCircle className="size-4 animate-spin" />}
              {banner ? "Save changes" : "Create banner"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ htmlFor, hint, children }: { htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-neutral-800">
      {children}
      {hint && <span className="text-xs font-normal text-neutral-400">{hint}</span>}
    </label>
  );
}
