import { Router } from "express";
import { getActivePromotion } from "../services/promotions.js";

export const promotionRouter = Router();

// GET /api/promotion — the store-wide offer running now, or null
promotionRouter.get("/", async (_req, res) => {
  const promo = await getActivePromotion();
  res.json(promo && { name: promo.name, percentOff: promo.percentOff, endsAt: promo.endsAt });
});
