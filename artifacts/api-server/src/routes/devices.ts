import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, devicesTable } from "@workspace/db";
import { CreateDeviceBody, UpdateDeviceBody, UpdateDeviceParams } from "@workspace/api-zod";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/devices", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const devices = await db
    .select()
    .from(devicesTable)
    .where(eq(devicesTable.userId, req.userId!))
    .orderBy(desc(devicesTable.createdAt));
  res.json(devices);
});

router.post("/devices", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateDeviceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [device] = await db
    .insert(devicesTable)
    .values({ ...parsed.data, userId: req.userId!, status: "offline" })
    .returning();
  res.status(201).json(device);
});

router.put("/devices/:id", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const params = UpdateDeviceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDeviceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [device] = await db
    .update(devicesTable)
    .set(parsed.data)
    .where(and(eq(devicesTable.id, params.data.id), eq(devicesTable.userId, req.userId!)))
    .returning();
  if (!device) {
    res.status(404).json({ error: "Device not found" });
    return;
  }
  res.json(device);
});

export default router;
