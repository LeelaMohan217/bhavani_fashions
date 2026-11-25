import { Router } from "express";
import { z } from "zod";
import { MENUS, getMenu } from "../services/navigation.js";

export const navigationRouter = Router();

// GET /api/navigation/:menu: the header or footer menu, as the store draws it
navigationRouter.get("/:menu", async (req, res) => {
  const menu = z.enum(MENUS).parse(req.params.menu);
  res.json(await getMenu(menu));
});
