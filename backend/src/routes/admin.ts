import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { login, logout, requireAdmin } from "../services/admin-auth.js";
import {
  OrderListQuery,
  StatusUpdate,
  alerts,
  dashboard,
  getAdminOrder,
  listOrders,
  markRefunded,
  updateOrderStatus,
} from "../services/admin-orders.js";
import {
  ProductInput,
  ProductListQuery,
  createProduct,
  getAdminProduct,
  listProducts,
  setProductActive,
  updateProduct,
} from "../services/admin-products.js";
import {
  BannerInput,
  BannerOrder,
  createBanner,
  deleteBanner,
  getBanner,
  listAllBanners,
  reorderBanners,
  setBannerActive,
  updateBanner,
} from "../services/banners.js";
import { PromotionInput, getLatestPromotion, savePromotion } from "../services/promotions.js";

export const adminRouter = Router();

// ─── Auth (public) ───────────────────────────────────────────────────────────
const LoginBody = z.object({ email: z.email(), password: z.string().min(1).max(200) });

adminRouter.post("/auth/login", async (req, res) => {
  const { email, password } = LoginBody.parse(req.body);
  // Forwarded by the storefront's server; falls back to the socket address.
  const ip = req.get("x-forwarded-for")?.split(",")[0]?.trim() || req.ip || "unknown";
  res.json(await login(email, password, ip));
});

// ─── Everything below requires an admin session ─────────────────────────────
adminRouter.use(requireAdmin);

adminRouter.get("/auth/me", (_req, res) => {
  res.json(res.locals.admin);
});

adminRouter.post("/auth/logout", async (_req, res) => {
  await logout(res.locals.adminToken);
  res.status(204).end();
});

adminRouter.get("/alerts", async (_req, res) => {
  res.json(await alerts());
});

adminRouter.get("/dashboard", async (_req, res) => {
  res.json(await dashboard());
});

adminRouter.get("/categories", async (_req, res) => {
  res.json(await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, slug: true } }));
});

// Products
adminRouter.get("/products", async (req, res) => {
  res.json(await listProducts(ProductListQuery.parse(req.query)));
});
adminRouter.get("/products/:id", async (req, res) => {
  res.json(await getAdminProduct(req.params.id));
});
adminRouter.post("/products", async (req, res) => {
  res.status(201).json(await createProduct(ProductInput.parse(req.body)));
});
adminRouter.put("/products/:id", async (req, res) => {
  res.json(await updateProduct(req.params.id, ProductInput.parse(req.body)));
});
adminRouter.patch("/products/:id/status", async (req, res) => {
  const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
  res.json(await setProductActive(req.params.id, isActive));
});

// Home-page banners
adminRouter.get("/banners", async (_req, res) => {
  res.json(await listAllBanners());
});
adminRouter.put("/banners/order", async (req, res) => {
  res.json(await reorderBanners(BannerOrder.parse(req.body).ids));
});
adminRouter.get("/banners/:id", async (req, res) => {
  res.json(await getBanner(req.params.id));
});
adminRouter.post("/banners", async (req, res) => {
  res.status(201).json(await createBanner(BannerInput.parse(req.body)));
});
adminRouter.put("/banners/:id", async (req, res) => {
  res.json(await updateBanner(req.params.id, BannerInput.parse(req.body)));
});
adminRouter.patch("/banners/:id/status", async (req, res) => {
  const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
  res.json(await setBannerActive(req.params.id, isActive));
});
adminRouter.delete("/banners/:id", async (req, res) => {
  await deleteBanner(req.params.id);
  res.status(204).end();
});

// Store-wide promotion (Black Friday etc.)
adminRouter.get("/promotion", async (_req, res) => {
  res.json(await getLatestPromotion());
});
adminRouter.put("/promotion", async (req, res) => {
  res.json(await savePromotion(PromotionInput.parse(req.body)));
});

// Orders
adminRouter.get("/orders", async (req, res) => {
  res.json(await listOrders(OrderListQuery.parse(req.query)));
});
adminRouter.get("/orders/:id", async (req, res) => {
  res.json(await getAdminOrder(req.params.id));
});
adminRouter.post("/orders/:id/status", async (req, res) => {
  res.json(await updateOrderStatus(req.params.id, StatusUpdate.parse(req.body), res.locals.admin.id));
});
adminRouter.post("/orders/:id/refunded", async (req, res) => {
  res.json(await markRefunded(req.params.id, res.locals.admin.id));
});
