"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ImagePlus, LoaderCircle, Trash2, TriangleAlert, X } from "lucide-react";
import { deleteCategory, saveCategory } from "@/lib/admin/actions";
import type { AdminCategory, AdminCategoryDetail, CategoryPayload } from "@/lib/admin/types";
import { Select } from "@/components/ui/select";
import { SuggestInput } from "@/components/ui/suggest-input";

/** Photos that ship with the store (public/banners) */
const STORE_PHOTOS = ["/banners/navy-silk-saree.jpg", "/banners/pink-half-saree.jpg", "/banners/festive-silk-sarees.jpg"];
import { Card, btn, inputCls } from "./ui";

const TOP = "__top";
const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

const fromCategory = (c?: AdminCategoryDetail, parentId?: string | null): CategoryPayload => ({
  name: c?.name ?? "",
  slug: c?.slug ?? "",
  tagline: c?.tagline ?? "",
  description: c?.description ?? "",
  imageUrl: c?.imageUrl ?? "",
  parentId: c ? c.parentId : (parentId ?? null),
  isActive: c?.isActive ?? true,
});

/** Add or edit a category or subcategory. */
export function CategoryEditor({
  category,
  all,
  defaultParentId,
}: {
  category?: AdminCategoryDetail;
  /** Every category, to choose a parent from */
  all: AdminCategory[];
  defaultParentId?: string | null;
}) {
  const router = useRouter();
  const [initial, setInitial] = useState(() => fromCategory(category, defaultParentId));
  const [form, setForm] = useState(initial);
  // Until the link name is edited by hand it follows the name
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, start] = useTransition();

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const set = <K extends keyof CategoryPayload>(key: K, value: CategoryPayload[K]) => {
    setForm((f) => ({ ...f, [key]: value, ...(key === "name" && !slugTouched ? { slug: slugify(String(value)) } : {}) }));
    setSaved(false);
    setErrors((e) => {
      const rest = { ...e };
      delete rest[key];
      return rest;
    });
  };

  // Parents: top-level categories other than this one. A category with subcategories stays top-level.
  const hasChildren = (category?.childCount ?? 0) > 0;
  const parentOptions = [
    { value: TOP, label: "Nothing (top-level category)" },
    ...all.filter((c) => !c.parentId && c.id !== category?.id).map((c) => ({ value: c.id, label: c.name })),
  ];
  const parentName = all.find((c) => c.id === form.parentId)?.name;

  const onSave = () => {
    setFormError(null);
    if (form.name.trim().length < 2) {
      setErrors({ name: "Add a name" });
      return;
    }
    start(async () => {
      const res = await saveCategory(category?.id ?? null, form);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.fieldErrors ? "Some details need fixing. See the highlighted fields." : res.error);
        return;
      }
      if (category) {
        const fresh = fromCategory(res.category);
        setInitial(fresh);
        setForm(fresh);
        setSaved(true);
        router.refresh();
      } else {
        router.push("/admin/categories");
        router.refresh();
      }
    });
  };

  const onDelete = () =>
    start(async () => {
      if (!category) return;
      const res = await deleteCategory(category.id);
      if (!res.ok) {
        setFormError(res.error);
        setConfirmDelete(false);
        return;
      }
      router.push("/admin/categories");
      router.refresh();
    });

  const field = (key: "name" | "slug" | "tagline" | "description" | "imageUrl") => ({
    id: key,
    value: form[key],
    "aria-invalid": Boolean(errors[key]) || undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (key === "slug") setSlugTouched(true);
      set(key, e.target.value);
    },
  });
  const err = (key: string) => (errors[key] ? <p className="mt-1.5 text-xs text-red-600">{errors[key]}</p> : null);

  const canDelete = category && category.productCount === 0 && category.childCount === 0;

  return (
    <div className="pb-28">
      {formError && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" /> {formError}
        </div>
      )}

      <div className="grid max-w-3xl gap-6">
        <Card title="Details">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Name</Label>
                <input {...field("name")} placeholder={form.parentId ? "e.g. Silk sarees" : "e.g. Sarees"} className={inputCls} />
                {err("name")}
              </div>
              <div>
                <Label htmlFor="slug" hint="Used in the store link">
                  Link name
                </Label>
                <div className="flex items-center rounded-md border border-neutral-200 bg-white shadow-xs focus-within:border-neutral-900 focus-within:ring-2 focus-within:ring-neutral-900/10">
                  <span className="shrink-0 pl-3 text-sm text-neutral-400">/shop/</span>
                  <input {...field("slug")} placeholder="sarees" className="h-9 min-w-0 flex-1 bg-transparent pr-3 text-sm focus:outline-none" />
                </div>
                {err("slug")}
              </div>
            </div>

            <div>
              <Label htmlFor="parentId">Inside</Label>
              <Select
                id="parentId"
                tone="admin"
                value={form.parentId ?? TOP}
                onChange={(v) => set("parentId", v === TOP ? null : v)}
                options={hasChildren ? parentOptions.slice(0, 1) : parentOptions}
                className={`${inputCls} flex items-center gap-2 text-left`}
              />
              <p className="mt-1.5 text-xs text-neutral-500">
                {hasChildren
                  ? "This category has subcategories, so it stays at the top level."
                  : form.parentId
                    ? `A subcategory of ${parentName}. Shoppers find it under "Type" on the ${parentName} page.`
                    : "A main category, like Sarees or Lehengas."}
              </p>
              {err("parentId")}
            </div>

            <div>
              <Label htmlFor="tagline" hint="Optional">
                Short tagline
              </Label>
              <input {...field("tagline")} placeholder="e.g. Six yards of story" className={inputCls} />
              {err("tagline")}
            </div>
            <div>
              <Label htmlFor="description" hint="Optional">
                Description
              </Label>
              <textarea {...field("description")} rows={3} placeholder="e.g. Handwoven silks, featherlight organzas and everyday cottons." className={`${inputCls} h-auto py-2`} />
              {err("description")}
            </div>
          </div>
        </Card>

        <Card title="Photo">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="shrink-0">
              <span className="relative flex aspect-[3/4] w-32 items-center justify-center overflow-hidden rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-neutral-400">
                {form.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- preview of an unsaved link
                  <img src={form.imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-1.5 text-xs">
                    <ImagePlus className="size-5" />
                    No photo
                  </span>
                )}
              </span>
              {form.imageUrl && (
                <button type="button" onClick={() => set("imageUrl", "")} className="mt-2 inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-600">
                  <X className="size-3.5" /> Remove photo
                </button>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Label htmlFor="imageUrl" hint="Optional">
                {form.imageUrl ? "Replace photo" : "Add a photo"}
              </Label>
              <SuggestInput
                id="imageUrl"
                value={form.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
                onPick={(v) => set("imageUrl", v)}
                suggestions={STORE_PHOTOS}
                placeholder="Pick a store photo or paste an image link"
                aria-invalid={Boolean(errors.imageUrl) || undefined}
                className={inputCls}
              />
              {err("imageUrl") ?? (
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
                  Choose one of the store&rsquo;s photos, or paste a link from Unsplash or Cloudinary. Shown in the round category
                  picture on the home page. Uploading from your computer arrives with Cloudinary.
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card title="Visibility">
          <label className="flex cursor-pointer items-start justify-between gap-4">
            <span>
              <span className="block text-sm font-medium">Show in the store</span>
              <span className="mt-0.5 block text-xs text-neutral-500">
                {form.isActive ? "Shoppers can see this category and its products." : "Hidden: this category and its products are not shown. Nothing is deleted."}
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={form.isActive}
              aria-label="Show in the store"
              onClick={() => set("isActive", !form.isActive)}
              className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${form.isActive ? "bg-neutral-900" : "bg-neutral-200"}`}
            >
              <span className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${form.isActive ? "translate-x-[1.125rem]" : "translate-x-0.5"}`} />
            </button>
          </label>
        </Card>

        {category && (
          <Card title="Delete category">
            {!canDelete ? (
              <p className="text-sm text-neutral-600">
                {category.childCount > 0
                  ? `It has ${category.childCount} subcategor${category.childCount === 1 ? "y" : "ies"}. Move or delete them first.`
                  : `It has ${category.productCount} product${category.productCount === 1 ? "" : "s"}. Move them to another category first, or hide this category instead.`}
              </p>
            ) : confirmDelete ? (
              <div className="space-y-3">
                <p className="text-sm text-neutral-700">Delete {category.name} for good?</p>
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
                <Trash2 className="size-4" /> Delete category
              </button>
            )}
          </Card>
        )}
      </div>

      {/* Sticky save bar */}
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
                <Check className="size-4" /> Saved. The store is updated.
              </span>
            ) : category ? (
              "No changes"
            ) : (
              "New category"
            )}
          </p>
          <div className="flex gap-2">
            {dirty && category && (
              <button type="button" disabled={pending} onClick={() => setForm(initial)} className={`${btn.base} ${btn.ghost}`}>
                Discard
              </button>
            )}
            <button type="button" disabled={pending || (!dirty && Boolean(category))} onClick={onSave} className={`${btn.base} ${btn.primary}`}>
              {pending && <LoaderCircle className="size-4 animate-spin" />}
              {category ? "Save changes" : form.parentId ? "Create subcategory" : "Create category"}
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
