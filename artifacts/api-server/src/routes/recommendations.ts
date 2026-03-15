import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, recommendationsTable, sensorReadingsTable, farmsTable } from "@workspace/db";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";
import { runRuleEngine } from "../lib/ruleEngine.js";

const router: IRouter = Router();

router.get("/recommendations", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const recommendations = await db
    .select()
    .from(recommendationsTable)
    .where(eq(recommendationsTable.userId, req.userId!))
    .orderBy(desc(recommendationsTable.createdAt))
    .limit(20);
  res.json(recommendations);
});

router.post("/recommendations/generate", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const [latestReading] = await db
    .select()
    .from(sensorReadingsTable)
    .where(eq(sensorReadingsTable.userId, req.userId!))
    .orderBy(desc(sensorReadingsTable.createdAt))
    .limit(1);

  if (!latestReading) {
    res.status(400).json({ error: "No sensor readings found to generate recommendations from" });
    return;
  }

  const [farm] = await db.select().from(farmsTable).where(eq(farmsTable.userId, req.userId!));
  const farmId = farm?.id ?? null;

  await runRuleEngine(req.userId!, farmId, {
    soilMoisture: latestReading.soilMoisture,
    temperature: latestReading.temperature,
    humidity: latestReading.humidity,
    lightIntensity: latestReading.lightIntensity,
    waterLevel: latestReading.waterLevel,
  });

  const recommendations = await db
    .select()
    .from(recommendationsTable)
    .where(eq(recommendationsTable.userId, req.userId!))
    .orderBy(desc(recommendationsTable.createdAt))
    .limit(20);
  res.status(201).json(recommendations);
});

export default router;
