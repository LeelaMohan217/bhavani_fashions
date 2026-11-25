"use client";

import { getUploadTicket } from "./actions";

export type UploadArea = "products" | "categories" | "banners";

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
/** Largest file we'll try to shrink in the browser (phone and camera photos are well under this) */
const MAX_ORIGINAL = 40 * 1024 * 1024;
/** Longest side after shrinking: sharp on the widest banner, and on product zoom */
const MAX_SIDE = 2400;

/** A plain-language reason a file can't be used, or null if it's fine */
export function checkPhoto(file: File): string | null {
  if (!TYPES.includes(file.type)) return `${file.name} isn't a JPG, PNG or WebP photo.`;
  if (file.size > MAX_ORIGINAL) return `${file.name} is over ${MAX_ORIGINAL / 1024 / 1024} MB. Please use a smaller photo.`;
  return null;
}

/**
 * Resizes a large photo to at most 2400 px on its longest side and re-encodes it as WebP (JPEG where the
 * browser can't make WebP). A 6 to 10 MB phone photo usually becomes 300 to 700 KB, so uploads are many
 * times faster. Small photos, and anything the browser can't read, are sent as they are.
 */
export async function shrinkPhoto(file: File): Promise<File> {
  try {
    // Honour the camera's rotation so portrait photos stay upright
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) {
      bitmap.close();
      return file; // already small enough
    }
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const encode = (type: string, quality: number) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, quality));
    let blob = await encode("image/webp", 0.85);
    // Browsers that can't write WebP hand back a PNG instead; use JPEG there
    if (!blob || blob.type !== "image/webp") blob = await encode("image/jpeg", 0.86);
    if (!blob || blob.size >= file.size) return file;

    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + `.${ext}`, { type: blob.type, lastModified: Date.now() });
  } catch {
    return file;
  }
}

/**
 * Shrinks a photo, then uploads it straight to Cloudinary (signed by our backend) and returns its https
 * link. `onProgress` gets 0 to 1 while it uploads.
 */
export async function uploadPhoto(file: File, area: UploadArea, onProgress?: (fraction: number) => void): Promise<string> {
  const problem = checkPhoto(file);
  if (problem) throw new Error(problem);

  // Ask for the signature while the photo is being shrunk
  const [res, photo] = await Promise.all([getUploadTicket(area), shrinkPhoto(file)]);
  if (!res.ok) throw new Error(res.error);
  const { ticket } = res;
  if (photo.size > ticket.maxBytes) {
    throw new Error(`${file.name} is still over ${Math.round(ticket.maxBytes / 1024 / 1024)} MB after resizing. Please use a smaller photo.`);
  }

  const body = new FormData();
  body.append("file", photo);
  body.append("api_key", ticket.apiKey);
  body.append("signature", ticket.signature);
  for (const [k, v] of Object.entries(ticket.params)) body.append(k, v);

  // XMLHttpRequest rather than fetch, for upload progress
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", ticket.uploadUrl);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      let data: { secure_url?: string; error?: { message?: string } } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* handled below */
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) resolve(data.secure_url);
      else reject(new Error(data.error?.message ? `Upload failed: ${data.error.message}` : "Upload failed. Please try again."));
    };
    xhr.onerror = () => reject(new Error("Upload failed. Please check your connection and try again."));
    xhr.send(body);
  });
}
