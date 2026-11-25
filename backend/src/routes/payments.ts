import express, { Router } from "express";
import { handleRazorpayWebhook } from "../services/payments.js";

export const paymentsRouter = Router();

// POST /api/payments/razorpay/webhook — called by Razorpay, not by shoppers.
// Needs the raw body: the signature is computed over the exact bytes Razorpay sent.
paymentsRouter.post("/razorpay/webhook", express.raw({ type: "application/json", limit: "1mb" }), async (req, res) => {
  const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
  const result = await handleRazorpayWebhook(body, req.get("x-razorpay-signature"));
  console.log(`[razorpay webhook] ${result}`);
  res.json({ ok: true });
});
