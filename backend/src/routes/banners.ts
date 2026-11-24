import { Router } from "express";
import { listLiveBanners } from "../services/banners.js";

export const bannersRouter = Router();

// GET /api/banners — live home-page banners, in order
bannersRouter.get("/", async (_req, res) => {
  res.json(await listLiveBanners());
});
