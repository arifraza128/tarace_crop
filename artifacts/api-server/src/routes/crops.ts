import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, cropsTable } from "@workspace/db";
import { CreateCropBody, UpdateCropBody, UpdateCropParams, DeleteCropParams } from "@workspace/api-zod";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/crops", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const crops = await db
    .select()
    .from(cropsTable)
    .where(eq(cropsTable.userId, req.userId!))
    .orderBy(desc(cropsTable.createdAt));
  res.json(crops);
});

router.post("/crops", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateCropBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [crop] = await db
    .insert(cropsTable)
    .values({ ...parsed.data, userId: req.userId! })
    .returning();
  res.status(201).json(crop);
});

router.put("/crops/:id", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const params = UpdateCropParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCropBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [crop] = await db
    .update(cropsTable)
    .set(parsed.data)
    .where(and(eq(cropsTable.id, params.data.id), eq(cropsTable.userId, req.userId!)))
    .returning();
  if (!crop) {
    res.status(404).json({ error: "Crop not found" });
    return;
  }
  res.json(crop);
});

router.delete("/crops/:id", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const params = DeleteCropParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [crop] = await db
    .delete(cropsTable)
    .where(and(eq(cropsTable.id, params.data.id), eq(cropsTable.userId, req.userId!)))
    .returning();
  if (!crop) {
    res.status(404).json({ error: "Crop not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
