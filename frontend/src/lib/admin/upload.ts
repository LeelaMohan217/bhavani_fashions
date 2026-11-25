"use client";

import { getUploadTicket } from "./actions";

export type UploadArea = "products" | "categories" | "banners";

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** A plain-language reason a file can't be used, or null if it's fine */
export function checkPhoto(file: File, maxBytes = 10 * 1024 * 1024): string | null {
  if (!TYPES.includes(file.type)) return `${file.name} isn't a JPG, PNG or WebP photo.`;
  if (file.size > maxBytes) return `${file.name} is over ${Math.round(maxBytes / 1024 / 1024)} MB. Please use a smaller photo.`;
  return null;
}

/**
 * Uploads one photo straight to Cloudinary (signed by our backend) and returns its https link.
 * `onProgress` gets 0 to 1 while it uploads.
 */
export async function uploadPhoto(file: File, area: UploadArea, onProgress?: (fraction: number) => void): Promise<string> {
  const problem = checkPhoto(file);
  if (problem) throw new Error(problem);

  const res = await getUploadTicket(area);
  if (!res.ok) throw new Error(res.error);
  const { ticket } = res;

  const body = new FormData();
  body.append("file", file);
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
