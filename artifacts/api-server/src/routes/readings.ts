import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, sensorReadingsTable, farmsTable } from "@workspace/db";
import { CreateManualReadingBody, CreateDeviceReadingBody, GetReadingsQueryParams } from "@workspace/api-zod";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";
import { runRuleEngine } from "../lib/ruleEngine.js";

const router: IRouter = Router();

router.get("/readings", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const query = GetReadingsQueryParams.safeParse(req.query);
  const limit = query.success && query.data.limit ? query.data.limit : 50;

  const readings = await db
    .select()
    .from(sensorReadingsTable)
    .where(eq(sensorReadingsTable.userId, req.userId!))
    .orderBy(desc(sensorReadingsTable.createdAt))
    .limit(limit);
  res.json(readings);
});

router.get("/readings/latest", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const [reading] = await db
    .select()
    .from(sensorReadingsTable)
    .where(eq(sensorReadingsTable.userId, req.userId!))
    .orderBy(desc(sensorReadingsTable.createdAt))
    .limit(1);
  if (!reading) {
    res.status(404).json({ error: "No readings found" });
    return;
  }
  res.json(reading);
});

router.post("/readings/manual", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateManualReadingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [farm] = await db.select().from(farmsTable).where(eq(farmsTable.userId, req.userId!));
  const farmId = farm?.id ?? null;

  const [reading] = await db
    .insert(sensorReadingsTable)
    .values({ ...parsed.data, userId: req.userId!, farmId, sourceType: "manual" })
    .returning();

  await runRuleEngine(req.userId!, farmId, parsed.data);
  res.status(201).json(reading);
});

router.post("/readings/demo", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const demoData = {
    soilMoisture: Math.random() * 60 + 20,
    temperature: Math.random() * 20 + 18,
    humidity: Math.random() * 60 + 30,
    lightIntensity: Math.random() * 900 + 100,
    waterLevel: Math.random() * 90 + 10,
  };

  const [farm] = await db.select().from(farmsTable).where(eq(farmsTable.userId, req.userId!));
  const farmId = farm?.id ?? null;

  const [reading] = await db
    .insert(sensorReadingsTable)
    .values({ ...demoData, userId: req.userId!, farmId, sourceType: "demo" })
    .returning();

  await runRuleEngine(req.userId!, farmId, demoData);
  res.status(201).json(reading);
});

router.post("/readings/device", async (req, res): Promise<void> => {
  const parsed = CreateDeviceReadingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { deviceId, ...sensorData } = parsed.data;

  const [reading] = await db
    .insert(sensorReadingsTable)
    .values({ ...sensorData, userId: 1, deviceId, sourceType: "device" })
    .returning();

  await runRuleEngine(1, null, sensorData);
  res.status(201).json(reading);
});

export default router;
