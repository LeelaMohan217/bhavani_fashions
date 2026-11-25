import { Router } from "express";
import { z } from "zod";
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
  LowStockQuery,
  ProductListQuery,
  createProduct,
  listLowStock,
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
import { BestSellersQuery, bestSellers } from "../services/admin-insights.js";
import {
  NewAdminInput,
  PasswordChange,
  PasswordReset,
  ProfileInput,
  changeOwnPassword,
  createAdmin,
  deleteAdmin,
  listAdmins,
  resetAdminPassword,
  setAdminActive,
  updateProfile,
} from "../services/admin-accounts.js";
import {
  CategoryInput,
  CategoryOrder,
  createCategory,
  deleteCategory,
  getAdminCategory,
  listAdminCategories,
  reorderCategories,
  setCategoryActive,
  updateCategory,
} from "../services/admin-categories.js";
import {
  CouponInput,
  CouponListQuery,
  createCoupon,
  deleteCoupon,
  getCoupon,
  listCoupons,
  setCouponActive,
  updateCoupon,
} from "../services/coupons.js";
import { CustomerListQuery, getCustomer, listCustomers } from "../services/admin-customers.js";
import { ActivityQuery, listActivity, recordActivity } from "../services/activity.js";

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
// Writes an activity-log line after every successful change below
adminRouter.use(recordActivity);

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

// Low stock
adminRouter.get("/low-stock", async (req, res) => {
  res.json(await listLowStock(LowStockQuery.parse(req.query)));
});

// Activity log
adminRouter.get("/activity", async (req, res) => {
  res.json(await listActivity(ActivityQuery.parse(req.query)));
});

// Customers (grouped by mobile number)
adminRouter.get("/customers", async (req, res) => {
  res.json(await listCustomers(CustomerListQuery.parse(req.query)));
});
adminRouter.get("/customers/:phone", async (req, res) => {
  res.json(await getCustomer(req.params.phone));
});

// Coupon codes
adminRouter.get("/coupons", async (req, res) => {
  res.json(await listCoupons(CouponListQuery.parse(req.query)));
});
adminRouter.get("/coupons/:id", async (req, res) => {
  res.json(await getCoupon(req.params.id));
});
adminRouter.post("/coupons", async (req, res) => {
  res.status(201).json(await createCoupon(CouponInput.parse(req.body)));
});
adminRouter.put("/coupons/:id", async (req, res) => {
  res.json(await updateCoupon(req.params.id, CouponInput.parse(req.body)));
});
adminRouter.patch("/coupons/:id/status", async (req, res) => {
  const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
  res.json(await setCouponActive(req.params.id, isActive));
});
adminRouter.delete("/coupons/:id", async (req, res) => {
  await deleteCoupon(req.params.id);
  res.status(204).end();
});

// Insights
adminRouter.get("/insights/best-sellers", async (req, res) => {
  res.json(await bestSellers(BestSellersQuery.parse(req.query)));
});

// Your own profile
adminRouter.put("/profile", async (req, res) => {
  res.json(await updateProfile(res.locals.admin.id, ProfileInput.parse(req.body)));
});
adminRouter.post("/profile/password", async (req, res) => {
  await changeOwnPassword(res.locals.admin.id, res.locals.adminToken, PasswordChange.parse(req.body));
  res.status(204).end();
});

// Admin accounts (everyone here is an Admin)
adminRouter.get("/accounts", async (_req, res) => {
  res.json(await listAdmins(res.locals.admin.id));
});
adminRouter.post("/accounts", async (req, res) => {
  res.status(201).json(await createAdmin(NewAdminInput.parse(req.body)));
});
adminRouter.patch("/accounts/:id/status", async (req, res) => {
  const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
  res.json(await setAdminActive(req.params.id, isActive, res.locals.admin.id));
});
adminRouter.post("/accounts/:id/password", async (req, res) => {
  await resetAdminPassword(req.params.id, PasswordReset.parse(req.body).password, res.locals.admin.id, res.locals.adminToken);
  res.status(204).end();
});
adminRouter.delete("/accounts/:id", async (req, res) => {
  await deleteAdmin(req.params.id, res.locals.admin.id);
  res.status(204).end();
});

// Categories and subcategories
adminRouter.get("/categories", async (_req, res) => {
  res.json(await listAdminCategories());
});
adminRouter.put("/categories/order", async (req, res) => {
  res.json(await reorderCategories(CategoryOrder.parse(req.body).ids));
});
adminRouter.get("/categories/:id", async (req, res) => {
  res.json(await getAdminCategory(req.params.id));
});
adminRouter.post("/categories", async (req, res) => {
  res.status(201).json(await createCategory(CategoryInput.parse(req.body)));
});
adminRouter.put("/categories/:id", async (req, res) => {
  res.json(await updateCategory(req.params.id, CategoryInput.parse(req.body)));
});
adminRouter.patch("/categories/:id/status", async (req, res) => {
  const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
  res.json(await setCategoryActive(req.params.id, isActive));
});
adminRouter.delete("/categories/:id", async (req, res) => {
  await deleteCategory(req.params.id);
  res.status(204).end();
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
