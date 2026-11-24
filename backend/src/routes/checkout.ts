import { Router } from "express";
import {
  PlaceOrderSchema,
  TrackOrderSchema,
  VerifyPaymentSchema,
  trackOrder,
  checkoutConfig,
  getOrder,
  placeOrder,
  verifyPayment,
} from "../services/checkout.js";

export const checkoutRouter = Router();
export const ordersRouter = Router();

// GET /api/checkout/config — fees and which payment methods are available
checkoutRouter.get("/config", (_req, res) => {
  res.json(checkoutConfig());
});

// POST /api/checkout — place an order (COD confirms immediately; Razorpay returns payment details)
checkoutRouter.post("/", async (req, res) => {
  const input = PlaceOrderSchema.parse(req.body);
  res.status(201).json(await placeOrder(input));
});

// POST /api/checkout/verify — confirm a Razorpay payment using its signature
checkoutRouter.post("/verify", async (req, res) => {
  const input = VerifyPaymentSchema.parse(req.body);
  res.json(await verifyPayment(input));
});

// POST /api/orders/track — look up an order by number + phone; returns its id
ordersRouter.post("/track", async (req, res) => {
  res.json(await trackOrder(TrackOrderSchema.parse(req.body)));
});

// GET /api/orders/:orderId — order confirmation details (order ids are unguessable cuids)
ordersRouter.get("/:orderId", async (req, res) => {
  res.json(await getOrder(req.params.orderId));
});
