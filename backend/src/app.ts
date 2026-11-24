import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { categoriesRouter } from "./routes/categories.js";
import { productsRouter } from "./routes/products.js";
import { cartsRouter } from "./routes/carts.js";
import { checkoutRouter, ordersRouter } from "./routes/checkout.js";
import { adminRouter } from "./routes/admin.js";
import { bannersRouter } from "./routes/banners.js";
import { promotionRouter } from "./routes/promotion.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "bhavani-fashion-api" });
  });

  app.use("/api/categories", categoriesRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/banners", bannersRouter);
  app.use("/api/promotion", promotionRouter);
  app.use("/api/carts", cartsRouter);
  app.use("/api/checkout", checkoutRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/admin", adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
