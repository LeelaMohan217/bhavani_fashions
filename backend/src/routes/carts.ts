import { Router } from "express";
import { z } from "zod";
import { STORE } from "../config/store.js";
import { addItem, createCart, getCart, removeItem, updateItem } from "../services/cart.js";

export const cartsRouter = Router();

const AddItemBody = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(STORE.maxQtyPerItem).default(1),
});

const UpdateItemBody = z.object({
  quantity: z.number().int().min(0).max(STORE.maxQtyPerItem),
});

// POST /api/carts — create an empty cart
cartsRouter.post("/", async (_req, res) => {
  res.status(201).json(await createCart());
});

// GET /api/carts/:cartId
cartsRouter.get("/:cartId", async (req, res) => {
  res.json(await getCart(req.params.cartId));
});

// POST /api/carts/:cartId/items — add a variant (increments if already in the bag)
cartsRouter.post("/:cartId/items", async (req, res) => {
  const body = AddItemBody.parse(req.body);
  res.json(await addItem(req.params.cartId, body.variantId, body.quantity));
});

// PATCH /api/carts/:cartId/items/:itemId — set quantity (0 removes)
cartsRouter.patch("/:cartId/items/:itemId", async (req, res) => {
  const body = UpdateItemBody.parse(req.body);
  res.json(await updateItem(req.params.cartId, req.params.itemId, body.quantity));
});

// DELETE /api/carts/:cartId/items/:itemId
cartsRouter.delete("/:cartId/items/:itemId", async (req, res) => {
  res.json(await removeItem(req.params.cartId, req.params.itemId));
});
