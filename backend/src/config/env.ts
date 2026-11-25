import "dotenv/config";
import { z } from "zod";

const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined));

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required (see .env.example)"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  RAZORPAY_KEY_ID: optional,
  RAZORPAY_KEY_SECRET: optional,
  /** The secret typed when adding the webhook in the Razorpay dashboard (Settings → Webhooks) */
  RAZORPAY_WEBHOOK_SECRET: optional,
  /** cloudinary://<api key>:<api secret>@<cloud name>, from Cloudinary → Settings → API Keys */
  CLOUDINARY_URL: optional,
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

const data = parsed.data;

if (data.RAZORPAY_KEY_ID?.startsWith("rzp_live_") && data.NODE_ENV !== "production") {
  console.error("Refusing to start: a LIVE Razorpay key is configured outside production.");
  process.exit(1);
}

/** Photo uploads: parsed from CLOUDINARY_URL, or null when it isn't set */
function parseCloudinary(value: string | undefined) {
  if (!value) return null;
  const m = value.match(/^cloudinary:\/\/([^:@\s]+):([^@\s]+)@([a-z0-9_-]+)$/i);
  if (!m) {
    console.error("CLOUDINARY_URL should look like cloudinary://<api key>:<api secret>@<cloud name>. Photo uploads are off.");
    return null;
  }
  return { apiKey: m[1], apiSecret: m[2], cloudName: m[3] };
}

export const env = {
  ...data,
  corsOrigins: data.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean),
  razorpayEnabled: Boolean(data.RAZORPAY_KEY_ID && data.RAZORPAY_KEY_SECRET),
  cloudinary: parseCloudinary(data.CLOUDINARY_URL),
};
