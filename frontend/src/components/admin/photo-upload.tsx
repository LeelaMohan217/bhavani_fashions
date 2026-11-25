"use client";

import { useRef, useState } from "react";
import { Link2, LoaderCircle, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { checkPhoto, uploadPhoto, type UploadArea } from "@/lib/admin/upload";
import { SuggestInput } from "@/components/ui/suggest-input";
import { inputCls } from "./ui";

/** A photo link the store can show: a store photo (/banners/…) or https from Unsplash or Cloudinary */
const ALLOWED_HOSTS = ["images.unsplash.com", "res.cloudinary.com"];
export function linkProblem(value: string): string | null {
  const v = value.trim();
  if (!v || /^\/banners\/[a-z0-9-]+\.(?:jpe?g|png)$/i.test(v)) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:") return "The link must start with https://";
    if (!ALLOWED_HOSTS.includes(u.hostname)) return `Links must come from ${ALLOWED_HOSTS.join(" or ")}. Or upload the photo instead.`;
    return null;
  } catch {
    return "That doesn't look like a link. Upload the photo instead, or copy the image address.";
  }
}

/** Admin preview: ask Cloudinary for a small, browser-friendly copy */
export const previewSrc = (url: string, width = 400) =>
  url.includes("res.cloudinary.com") && url.includes("/upload/") ? url.replace("/upload/", `/upload/f_auto,c_limit,w_${width},q_auto/`) : url;

/**
 * Drop target: drag photos onto it, or click (or press Enter) to choose from the computer or phone.
 * Highlights while a file is dragged over it.
 */
export function DropZone({
  multiple = false,
  disabled,
  onFiles,
  className = "",
  children,
}: {
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  className?: string;
  children: (state: { over: boolean }) => React.ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const take = (list: FileList | null) => {
    const files = [...(list ?? [])];
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={multiple ? "Upload photos: drop them here or press to choose" : "Upload a photo: drop it here or press to choose"}
      onClick={() => !disabled && input.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          input.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled) take(e.dataTransfer.files);
      }}
      className={`cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${disabled ? "pointer-events-none" : ""} ${className}`}
    >
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple={multiple}
        hidden
        onChange={(e) => {
          take(e.target.files);
          e.target.value = ""; // allow choosing the same file again
        }}
      />
      {children({ over })}
    </div>
  );
}

/** Thin progress bar shown while a photo uploads */
export function UploadBar({ value }: { value: number }) {
  return (
    <span className="block h-1 w-full overflow-hidden rounded-full bg-neutral-200">
      <span className="block h-full rounded-full bg-neutral-900 transition-[width] duration-150" style={{ width: `${Math.round(value * 100)}%` }} />
    </span>
  );
}

/**
 * One photo (categories, banners): the box is the only upload control. Click it or drop a file on it to
 * upload; once there's a photo, the same box replaces it. Remove clears it, and pasting a link stays
 * available under "Use a link instead".
 */
export function SinglePhoto({
  value,
  onChange,
  area,
  suggestions = [],
  invalid,
  frameClassName = "aspect-[3/4] w-40",
  hint = "JPG, PNG or WebP. Large photos are resized for you.",
}: {
  value: string;
  onChange: (url: string) => void;
  area: UploadArea;
  suggestions?: string[];
  invalid?: boolean;
  /** Size and shape of the preview frame */
  frameClassName?: string;
  hint?: string;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLink, setShowLink] = useState(false);
  const uploading = progress !== null;

  const onFiles = async ([file]: File[]) => {
    const problem = checkPhoto(file);
    if (problem) return setError(problem);
    setError(null);
    setProgress(0);
    try {
      onChange(await uploadPhoto(file, area, setProgress));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProgress(null);
    }
  };

  const link = linkProblem(value);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <DropZone onFiles={onFiles} disabled={uploading} className={`shrink-0 ${frameClassName}`}>
        {({ over }) => (
          <span
            className={`relative flex size-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-md border text-center text-xs transition-colors ${
              over ? "border-neutral-900 bg-neutral-100" : invalid ? "border-red-300 bg-red-50/40" : value ? "border-neutral-200 bg-neutral-50" : "border-dashed border-neutral-300 bg-neutral-50 hover:border-neutral-400"
            }`}
          >
            {value && !link ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin preview of any allowed link
              <img src={previewSrc(value)} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <>
                <UploadCloud className="size-5 text-neutral-400" />
                <span className="px-2 text-neutral-500">
                  <span className="font-medium text-neutral-900">Click to upload</span>
                  <br />
                  or drag a photo here
                </span>
              </>
            )}
            {value && !link && !uploading && (
              <span
                className={`absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/85 px-3 text-[0.7rem] font-medium leading-snug text-neutral-900 transition-opacity ${
                  over ? "opacity-100" : "opacity-0 hover:opacity-100"
                }`}
              >
                <RefreshCw className="size-4" />
                {over ? "Drop to replace" : "Click or drop to replace"}
              </span>
            )}
            {uploading && (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/85 px-4">
                <LoaderCircle className="size-4 animate-spin text-neutral-700" />
                <UploadBar value={progress} />
                <span className="text-[0.7rem] text-neutral-600">Uploading… {Math.round(progress * 100)}%</span>
              </span>
            )}
          </span>
        )}
      </DropZone>

      <div className="min-w-0 flex-1 space-y-2">
        {/* Pulled left by the buttons' padding so their text lines up with the hint below */}
        <div className="-ml-2.5 flex flex-wrap gap-1">
          {value && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => onChange("")}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs text-neutral-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="size-3.5" /> Remove
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowLink((s) => !s)}
            aria-expanded={showLink}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          >
            <Link2 className="size-3.5" /> {showLink ? "Hide link" : "Use a link instead"}
          </button>
        </div>

        {showLink && (
          <SuggestInput
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPick={onChange}
            suggestions={suggestions}
            placeholder={suggestions.length ? "Pick a store photo or paste an image link" : "Paste an image link"}
            aria-label="Photo link"
            aria-invalid={Boolean(link) || undefined}
            className={`${inputCls} !h-8`}
          />
        )}

        {error ? (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        ) : link && value ? (
          <p className="text-xs text-amber-700">{link}</p>
        ) : (
          <p className="text-xs text-neutral-500">{hint}</p>
        )}
      </div>
    </div>
  );
}
