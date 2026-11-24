"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, ImagePlus, LoaderCircle, Plus, Rows3, Trash2, TriangleAlert } from "lucide-react";
import { saveProduct } from "@/lib/admin/actions";
import type { AdminCategory, AdminProduct } from "@/lib/admin/types";
import { discountPercent, formatPrice } from "@/lib/format";
import { Card, btn, inputCls } from "./ui";

const IMAGE_HOSTS = ["images.unsplash.com", "res.cloudinary.com"];
const SIZE_RUN = ["XS", "S", "M", "L", "XL"];

type VariantRow = { key: string; id?: string; sku: string; color: string; colorHex: string; size: string; stock: string };
type ImageRow = { key: string; url: string; alt: string };
type FormState = {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  fabric: string;
  occasion: string;
  care: string;
  price: string;
  compareAtPrice: string;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  images: ImageRow[];
  variants: VariantRow[];
};

let keySeq = 0;
const k = () => `k${++keySeq}`;
const toRupees = (paise: number | null | undefined) => (paise == null ? "" : String(paise / 100));
const toPaise = (rupees: string) => Math.round(parseFloat(rupees) * 100);
const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
const skuBase = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "BF";

function initialState(p?: AdminProduct, categories: AdminCategory[] = []): FormState {
  return {
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    description: p?.description ?? "",
    categoryId: p?.categoryId ?? categories[0]?.id ?? "",
    fabric: p?.fabric ?? "",
    occasion: p?.occasion ?? "",
    care: p?.care ?? "",
    price: toRupees(p?.price),
    compareAtPrice: toRupees(p?.compareAtPrice),
    isActive: p?.isActive ?? true,
    isFeatured: p?.isFeatured ?? false,
    isNewArrival: p?.isNewArrival ?? true,
    images: (p?.images ?? []).map((i) => ({ key: k(), ...i })),
    variants: (p?.variants ?? [{ sku: "", color: "", colorHex: "#9E1B32", size: null, stock: 0 }]).map((v) => ({
      key: k(),
      id: v.id,
      sku: v.sku,
      color: v.color,
      colorHex: v.colorHex,
      size: v.size ?? "",
      stock: String(v.stock),
    })),
  };
}

/** Strips client-only keys so dirty-checking compares content, not React keys */
const snapshot = (s: FormState) =>
  JSON.stringify({
    ...s,
    images: s.images.map((i) => ({ url: i.url, alt: i.alt })),
    variants: s.variants.map((v) => ({ id: v.id, sku: v.sku, color: v.color, colorHex: v.colorHex, size: v.size, stock: v.stock })),
  });

export function ProductEditor({ product, categories }: { product?: AdminProduct; categories: AdminCategory[] }) {
  const router = useRouter();
  const [initial, setInitial] = useState(() => initialState(product, categories));
  const [form, setForm] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const [newImage, setNewImage] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);

  const dirty = useMemo(() => snapshot(form) !== snapshot(initial), [form, initial]);
  const totalStock = form.variants.reduce((n, v) => n + (parseInt(v.stock) || 0), 0);
  const priceNum = parseFloat(form.price);
  const compareNum = parseFloat(form.compareAtPrice);
  const off = priceNum > 0 && compareNum > 0 ? discountPercent(toPaise(form.price), toPaise(form.compareAtPrice)) : null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  };

  const field = (key: "name" | "description" | "fabric" | "occasion" | "care" | "price" | "compareAtPrice") => ({
    id: key,
    value: form[key],
    "aria-invalid": Boolean(errors[key]) || undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      set(key, value);
      if (key === "name" && !slugTouched) set("slug", slugify(value));
    },
  });

  // ─── Images ────────────────────────────────────────────────────────────────
  const addImage = () => {
    const url = newImage.trim();
    try {
      const u = new URL(url);
      if (u.protocol !== "https:") throw new Error("Image link must start with https://");
      if (!IMAGE_HOSTS.includes(u.hostname)) throw new Error(`For now, images must come from ${IMAGE_HOSTS.join(" or ")}.`);
      if (form.images.some((i) => i.url === url)) throw new Error("That image is already added.");
    } catch (e) {
      setImageError(e instanceof TypeError ? "That doesn't look like a valid link." : (e as Error).message);
      return;
    }
    set("images", [...form.images, { key: k(), url, alt: "" }]);
    setNewImage("");
    setImageError(null);
  };
  const moveImage = (i: number, dir: -1 | 1) => {
    const next = [...form.images];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    set("images", next);
  };

  // ─── Variants ──────────────────────────────────────────────────────────────
  const updateVariant = (i: number, patch: Partial<VariantRow>) => {
    set(
      "variants",
      form.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)),
    );
  };
  const addVariant = () => {
    const last = form.variants.at(-1);
    const n = form.variants.length + 1;
    set("variants", [
      ...form.variants,
      {
        key: k(),
        sku: `${skuBase(form.name)}-${String(n).padStart(2, "0")}`,
        color: last?.color ?? "",
        colorHex: last?.colorHex ?? "#9E1B32",
        size: "",
        stock: "0",
      },
    ]);
  };
  const addSizeRun = () => {
    const last = form.variants.at(-1);
    if (!last) return;
    const base = `${skuBase(form.name)}-${skuBase(last.color || "C")}`;
    const existing = new Set(form.variants.filter((v) => v.color === last.color).map((v) => v.size));
    const rows = SIZE_RUN.filter((s) => !existing.has(s)).map((size) => ({
      key: k(),
      sku: `${base}-${size}`,
      color: last.color,
      colorHex: last.colorHex,
      size,
      stock: "0",
    }));
    // Replace a lone free-size row of this colour with the size run
    const keep = form.variants.filter((v) => !(v.color === last.color && !v.size && v.stock === "0"));
    set("variants", [...keep, ...rows]);
  };

  // ─── Save ──────────────────────────────────────────────────────────────────
  const onSave = () =>
    start(async () => {
      setFormError(null);
      setErrors({});
      const res = await saveProduct(product?.id ?? null, {
        name: form.name,
        slug: form.slug || undefined,
        description: form.description,
        categoryId: form.categoryId,
        fabric: form.fabric || undefined,
        occasion: form.occasion || undefined,
        care: form.care || undefined,
        price: form.price ? toPaise(form.price) : 0,
        compareAtPrice: form.compareAtPrice ? toPaise(form.compareAtPrice) : null,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        isNewArrival: form.isNewArrival,
        images: form.images.map(({ url, alt }) => ({ url, alt })),
        variants: form.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          color: v.color,
          colorHex: v.colorHex,
          size: v.size || null,
          stock: parseInt(v.stock) || 0,
        })),
      });

      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.fieldErrors ? "Please fix the highlighted fields." : res.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (!product) {
        router.push(`/admin/products/${res.product.id}`);
        return;
      }
      const fresh = initialState(res.product, categories);
      setInitial(fresh);
      setForm(fresh);
      setSaved(true);
      router.refresh();
    });

  const err = (key: string) => errors[key] && <p className="mt-1.5 text-xs text-red-600">{errors[key]}</p>;
  const variantErrors = Object.entries(errors).filter(([key]) => key.startsWith("variants"));

  return (
    <div className="pb-24">
      {formError && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {formError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card title="Basics">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <input {...field("name")} placeholder="e.g. Rani Kanjivaram Silk Saree" className={inputCls} />
                {err("name")}
              </div>
              <div>
                <Label htmlFor="slug" hint="Used in the product's web address">URL slug</Label>
                <div className="flex rounded-md shadow-xs">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-500">
                    /products/
                  </span>
                  <input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set("slug", slugify(e.target.value));
                    }}
                    aria-invalid={Boolean(errors.slug) || undefined}
                    className={`${inputCls} rounded-l-none shadow-none`}
                  />
                </div>
                {err("slug")}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea {...field("description")} rows={5} className={`${inputCls} h-auto py-2 leading-relaxed`} placeholder="Weave, drape, story and what makes this piece special." />
                {err("description")}
              </div>
            </div>
          </Card>

          <Card
            title={`Images${form.images.length ? ` · ${form.images.length}` : ""}`}
            action={<span className="text-xs text-neutral-500">First image is the cover</span>}
          >
            {form.images.length > 0 && (
              <ul className="mb-4 divide-y divide-neutral-100 rounded-md border border-neutral-200">
                {form.images.map((img, i) => (
                  <li key={img.key} className="flex items-center gap-3 p-2.5">
                    <span className="relative h-20 w-15 shrink-0 overflow-hidden rounded bg-neutral-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="size-full object-cover" />
                      {i === 0 && (
                        <span className="absolute inset-x-0 bottom-0 bg-neutral-900/80 py-0.5 text-center text-[0.6rem] font-medium text-white">
                          Cover
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="truncate tabular-nums text-[0.7rem] text-neutral-400" title={img.url}>{img.url}</p>
                      <input
                        value={img.alt}
                        onChange={(e) => set("images", form.images.map((x, idx) => (idx === i ? { ...x, alt: e.target.value } : x)))}
                        placeholder="Describe the image (for accessibility & SEO)"
                        aria-label={`Alt text for image ${i + 1}`}
                        className={`${inputCls} h-8`}
                      />
                      {err(`images.${i}.url`)}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <IconButton label="Move up" disabled={i === 0} onClick={() => moveImage(i, -1)}><ArrowUp className="size-3.5" /></IconButton>
                      <IconButton label="Move down" disabled={i === form.images.length - 1} onClick={() => moveImage(i, 1)}><ArrowDown className="size-3.5" /></IconButton>
                    </div>
                    <IconButton label="Remove image" danger onClick={() => set("images", form.images.filter((_, idx) => idx !== i))}>
                      <Trash2 className="size-4" />
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2">
              <input
                value={newImage}
                onChange={(e) => {
                  setNewImage(e.target.value);
                  setImageError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addImage();
                  }
                }}
                placeholder="Paste an image link (https://images.unsplash.com/…)"
                aria-label="Image link"
                aria-invalid={Boolean(imageError) || undefined}
                className={inputCls}
              />
              <button type="button" onClick={addImage} disabled={!newImage.trim()} className={`${btn.base} ${btn.secondary} shrink-0`}>
                <ImagePlus className="size-4" /> Add
              </button>
            </div>
            {imageError ? (
              <p className="mt-1.5 text-xs text-red-600">{imageError}</p>
            ) : (
              <p className="mt-1.5 text-xs text-neutral-500">
                Paste links from Unsplash or Cloudinary for now. Direct uploads will arrive once Cloudinary is connected.
              </p>
            )}
          </Card>

          <Card
            title="Variants"
            action={<span className="text-xs tabular-nums text-neutral-500">{totalStock} pieces in stock</span>}
            bodyClassName=""
          >
            {/* `relative` keeps the absolutely-positioned sr-only header inside this scroller on small screens */}
            <div className="relative overflow-x-auto">


              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-left text-xs text-neutral-500">
                    <th className="px-4 py-2 font-medium">Colour</th>
                    <th className="w-24 px-2 py-2 font-medium">Size</th>
                    <th className="w-40 px-2 py-2 font-medium">SKU</th>
                    <th className="w-24 px-2 py-2 font-medium">Stock</th>
                    <th className="w-12 px-2 py-2"><span className="sr-only">Remove</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {form.variants.map((v, i) => (
                    <tr key={v.key} className="align-top">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <label className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-md border border-neutral-200" title="Pick colour">
                            <span className="absolute inset-1 rounded" style={{ backgroundColor: v.colorHex }} />
                            <input
                              type="color"
                              value={v.colorHex}
                              onChange={(e) => updateVariant(i, { colorHex: e.target.value.toUpperCase() })}
                              aria-label={`Swatch colour for variant ${i + 1}`}
                              className="absolute inset-0 cursor-pointer opacity-0"
                            />
                          </label>
                          <input
                            value={v.color}
                            onChange={(e) => updateVariant(i, { color: e.target.value })}
                            placeholder="Colour name"
                            aria-label={`Colour name for variant ${i + 1}`}
                            aria-invalid={Boolean(errors[`variants.${i}.color`]) || undefined}
                            className={inputCls}
                          />
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={v.size}
                          onChange={(e) => updateVariant(i, { size: e.target.value.toUpperCase() })}
                          list="size-options"
                          placeholder="Free"
                          aria-label={`Size for variant ${i + 1}`}
                          className={inputCls}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={v.sku}
                          onChange={(e) => updateVariant(i, { sku: e.target.value.toUpperCase() })}
                          placeholder="SKU"
                          aria-label={`SKU for variant ${i + 1}`}
                          aria-invalid={Boolean(errors[`variants.${i}.sku`]) || undefined}
                          className={`${inputCls} tabular-nums text-xs`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={v.stock}
                          onChange={(e) => updateVariant(i, { stock: e.target.value })}
                          aria-label={`Stock for variant ${i + 1}`}
                          className={`${inputCls} tabular-nums ${parseInt(v.stock) === 0 ? "text-red-600" : ""}`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <IconButton
                          label={`Remove variant ${i + 1}`}
                          danger
                          disabled={form.variants.length === 1}
                          onClick={() => set("variants", form.variants.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 className="size-4" />
                        </IconButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <datalist id="size-options">
                {["XS", "S", "M", "L", "XL", "XXL"].map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            {variantErrors.length > 0 && (
              <ul className="space-y-0.5 border-t border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-700">
                {variantErrors.map(([key, msg]) => {
                  const row = key.match(/^variants\.(\d+)/)?.[1];
                  return <li key={key}>{row !== undefined ? `Row ${Number(row) + 1}: ` : ""}{msg}</li>;
                })}
              </ul>
            )}
            <div className="flex flex-wrap gap-2 border-t border-neutral-100 px-4 py-3">
              <button type="button" onClick={addVariant} className={`${btn.base} ${btn.secondary} h-8`}>
                <Plus className="size-4" /> Add variant
              </button>
              <button type="button" onClick={addSizeRun} className={`${btn.base} ${btn.ghost} h-8`}>
                <Rows3 className="size-4" /> Add sizes XS–XL for last colour
              </button>
            </div>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card title="Visibility">
            <div className="space-y-4">
              <Switch
                checked={form.isActive}
                onChange={(v) => set("isActive", v)}
                label="Live in store"
                description={form.isActive ? "Customers can see and buy this piece." : "Hidden from customers. Past orders are unaffected."}
              />
              <Switch checked={form.isFeatured} onChange={(v) => set("isFeatured", v)} label="Featured" description="Shown in “The Bhavani edit” on the home page." />
              <Switch checked={form.isNewArrival} onChange={(v) => set("isNewArrival", v)} label="New arrival" description="Adds a “New” tag and lists it under New In." />
            </div>
          </Card>

          <Card title="Pricing">
            <div className="space-y-4">
              <div>
                <Label htmlFor="price">Price</Label>
                <RupeeInput {...field("price")} />
                {err("price")}
              </div>
              <div>
                <Label htmlFor="compareAtPrice" hint="Optional">Compare-at price</Label>
                <RupeeInput {...field("compareAtPrice")} />
                {err("compareAtPrice")}
              </div>
              {priceNum > 0 && (
                <div className="rounded-md bg-neutral-50 px-3 py-2.5 text-sm">
                  <span className="text-neutral-500">Customers see </span>
                  <span className="font-medium tabular-nums">{formatPrice(toPaise(form.price))}</span>
                  {off && (
                    <>
                      <s className="ml-2 text-neutral-400 tabular-nums">{formatPrice(toPaise(form.compareAtPrice))}</s>
                      <span className="ml-2 font-medium text-emerald-700">{off}% off</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card title="Organisation">
            <div className="space-y-4">
              <div>
                <Label htmlFor="categoryId">Category</Label>
                <select
                  id="categoryId"
                  value={form.categoryId}
                  onChange={(e) => set("categoryId", e.target.value)}
                  className={inputCls}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {err("categoryId")}
              </div>
              <div>
                <Label htmlFor="fabric">Fabric</Label>
                <input {...field("fabric")} placeholder="e.g. Silk" list="fabric-options" className={inputCls} />
                <datalist id="fabric-options">
                  {["Silk", "Cotton", "Organza", "Georgette", "Chanderi", "Linen", "Crepe", "Velvet", "Tussar Silk"].map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label htmlFor="occasion">Occasion</Label>
                <input {...field("occasion")} placeholder="e.g. Wedding" list="occasion-options" className={inputCls} />
                <datalist id="occasion-options">
                  {["Wedding", "Festive", "Party", "Everyday", "Work", "Sangeet", "Haldi", "Ceremony"].map((o) => (
                    <option key={o} value={o} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label htmlFor="care">Care instructions</Label>
                <textarea {...field("care")} rows={3} placeholder="e.g. Dry clean only." className={`${inputCls} h-auto py-2`} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/90 backdrop-blur transition-[left] duration-200 lg:left-[var(--sidebar-w,15rem)]">
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
                <Check className="size-4" /> All changes saved
              </span>
            ) : product ? (
              "No changes"
            ) : (
              "New product"
            )}
          </p>
          <div className="flex gap-2">
            {dirty && product && (
              <button type="button" disabled={pending} onClick={() => setForm(initial)} className={`${btn.base} ${btn.ghost}`}>
                Discard
              </button>
            )}
            <button type="button" disabled={pending || (!dirty && Boolean(product))} onClick={onSave} className={`${btn.base} ${btn.primary}`}>
              {pending && <LoaderCircle className="size-4 animate-spin" />}
              {product ? "Save changes" : "Create product"}
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

function RupeeInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">₹</span>
      <input type="number" min={0} step="1" inputMode="decimal" placeholder="0" {...props} className={`${inputCls} pl-7 tabular-nums`} />
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex size-8 items-center justify-center rounded-md text-neutral-500 transition-colors disabled:pointer-events-none disabled:opacity-30 ${
        danger ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-neutral-100 hover:text-neutral-900"
      }`}
    >
      {children}
    </button>
  );
}

function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-0.5 block text-xs text-neutral-500">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-neutral-900" : "bg-neutral-200"}`}
      >
        <span className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[1.125rem]" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}
