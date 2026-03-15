import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, farmsTable } from "@workspace/db";
import { CreateFarmBody, UpdateFarmBody } from "@workspace/api-zod";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/farm", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const [farm] = await db.select().from(farmsTable).where(eq(farmsTable.userId, req.userId!));
  if (!farm) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }
  res.json(farm);
});

router.post("/farm", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateFarmBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(farmsTable).where(eq(farmsTable.userId, req.userId!));
  if (existing.length > 0) {
    res.status(400).json({ error: "Farm already exists. Use PUT to update." });
    return;
  }

  const [farm] = await db
    .insert(farmsTable)
    .values({ ...parsed.data, userId: req.userId! })
    .returning();
  res.status(201).json(farm);
});

router.put("/farm", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const parsed = UpdateFarmBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(farmsTable).where(eq(farmsTable.userId, req.userId!));
  if (existing.length === 0) {
    const [farm] = await db
      .insert(farmsTable)
      .values({ ...parsed.data, userId: req.userId! })
      .returning();
    res.json(farm);
    return;
  }

  const [farm] = await db
    .update(farmsTable)
    .set(parsed.data)
    .where(eq(farmsTable.userId, req.userId!))
    .returning();
  res.json(farm);
});

export default router;
