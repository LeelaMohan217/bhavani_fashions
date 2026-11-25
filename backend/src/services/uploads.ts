// Photo uploads go straight from the admin's browser to Cloudinary. The backend only signs each upload,
// so the API secret never leaves the server and nobody else can upload to the store's account.
import { createHash } from "node:crypto";
import { z } from "zod";
import { env } from "../config/env.js";
import { HttpError } from "../lib/http-error.js";

/** What the photo is for; each goes into its own Cloudinary folder */
export const UploadInput = z.object({ area: z.enum(["products", "categories", "banners"]) });

/** Accepted photo types and the largest size, checked by Cloudinary as well as in the browser */
const FORMATS = "jpg,jpeg,png,webp,avif";
export const MAX_BYTES = 10 * 1024 * 1024;

export function signUpload(area: z.infer<typeof UploadInput>["area"]) {
  const c = env.cloudinary;
  if (!c) {
    throw new HttpError(503, "Photo uploads aren't set up yet. Add CLOUDINARY_URL to the backend settings, then restart it.");
  }
  // Every parameter sent with the upload (except file, api_key and the signature) must be signed,
  // sorted by name, as "a=1&b=2" followed by the secret
  const params: Record<string, string> = {
    allowed_formats: FORMATS,
    folder: `kosha/${area}`,
    timestamp: String(Math.floor(Date.now() / 1000)),
  };
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const signature = createHash("sha1").update(toSign + c.apiSecret).digest("hex");

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${c.cloudName}/image/upload`,
    apiKey: c.apiKey,
    signature,
    params,
    maxBytes: MAX_BYTES,
  };
}
