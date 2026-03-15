import { Router, type IRouter } from "express";
import { eq, gte, desc } from "drizzle-orm";
import { db, sensorReadingsTable, alertsTable, cropsTable } from "@workspace/db";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

function formatPoint(reading: {
  createdAt: Date;
  soilMoisture: number;
  temperature: number;
  humidity: number;
  lightIntensity: number;
  waterLevel: number;
}) {
  return {
    timestamp: reading.createdAt.toISOString(),
    soilMoisture: reading.soilMoisture,
    temperature: reading.temperature,
    humidity: reading.humidity,
    lightIntensity: reading.lightIntensity,
    waterLevel: reading.waterLevel,
  };
}

function generateNotes(readings: { soilMoisture: number; temperature: number; waterLevel: number }[]): string[] {
  const notes: string[] = [];
  if (readings.length === 0) return ["No data available for this period."];

  const avgMoisture = readings.reduce((sum, r) => sum + r.soilMoisture, 0) / readings.length;
  const avgTemp = readings.reduce((sum, r) => sum + r.temperature, 0) / readings.length;
  const avgWater = readings.reduce((sum, r) => sum + r.waterLevel, 0) / readings.length;

  if (avgMoisture < 30) notes.push("Moisture has remained low this period. Irrigation is recommended.");
  else if (avgMoisture > 70) notes.push("Soil moisture levels have been consistently high.");
  else notes.push("Soil moisture levels are within normal range.");

  if (avgTemp > 33) notes.push("Temperature stress risk observed. Monitor crops closely.");
  else if (avgTemp < 18) notes.push("Temperatures are below optimal for most crops.");

  if (avgWater < 30) notes.push("Water level has been low. Check water storage regularly.");

  if (notes.length === 1 && avgMoisture >= 30 && avgMoisture <= 70) {
    notes.push("Farm conditions are stable this period.");
  }

  return notes;
}

router.get("/analytics/daily", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const readings = await db
    .select()
    .from(sensorReadingsTable)
    .where(eq(sensorReadingsTable.userId, req.userId!))
    .orderBy(desc(sensorReadingsTable.createdAt))
    .limit(100);

  const filtered = readings.filter(r => r.createdAt >= since);
  res.json({ points: filtered.map(formatPoint), notes: generateNotes(filtered) });
});

router.get("/analytics/weekly", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const readings = await db
    .select()
    .from(sensorReadingsTable)
    .where(eq(sensorReadingsTable.userId, req.userId!))
    .orderBy(desc(sensorReadingsTable.createdAt))
    .limit(500);

  const filtered = readings.filter(r => r.createdAt >= since);
  res.json({ points: filtered.map(formatPoint), notes: generateNotes(filtered) });
});

router.get("/analytics/monthly", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const readings = await db
    .select()
    .from(sensorReadingsTable)
    .where(eq(sensorReadingsTable.userId, req.userId!))
    .orderBy(desc(sensorReadingsTable.createdAt))
    .limit(1000);

  const filtered = readings.filter(r => r.createdAt >= since);
  res.json({ points: filtered.map(formatPoint), notes: generateNotes(filtered) });
});

router.get("/analytics/summary", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const readings = await db
    .select()
    .from(sensorReadingsTable)
    .where(eq(sensorReadingsTable.userId, req.userId!))
    .orderBy(desc(sensorReadingsTable.createdAt))
    .limit(50);

  const activeAlertsCount = await db
    .select()
    .from(alertsTable)
    .where(eq(alertsTable.userId, req.userId!));

  const activeAlerts = activeAlertsCount.filter(a => a.status === "active").length;

  const crops = await db
    .select()
    .from(cropsTable)
    .where(eq(cropsTable.userId, req.userId!))
    .orderBy(desc(cropsTable.createdAt))
    .limit(1);

  if (readings.length === 0) {
    res.json({
      avgSoilMoisture: 0,
      avgTemperature: 0,
      avgHumidity: 0,
      avgLightIntensity: 0,
      avgWaterLevel: 0,
      farmCondition: "No data",
      cropNotes: ["No sensor readings yet. Generate a demo reading to get started."],
      totalReadings: 0,
      activeAlerts,
    });
    return;
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const avgSoilMoisture = avg(readings.map(r => r.soilMoisture));
  const avgTemperature = avg(readings.map(r => r.temperature));
  const avgHumidity = avg(readings.map(r => r.humidity));
  const avgLightIntensity = avg(readings.map(r => r.lightIntensity));
  const avgWaterLevel = avg(readings.map(r => r.waterLevel));

  let farmCondition = "Stable";
  if (avgSoilMoisture < 30 || avgWaterLevel < 25) farmCondition = "Needs Attention";
  else if (avgTemperature > 35 && avgHumidity < 40) farmCondition = "Stress Risk";
  else if (avgSoilMoisture > 50 && avgWaterLevel > 50) farmCondition = "Excellent";

  const cropNotes: string[] = [];
  if (crops.length > 0) {
    const crop = crops[0];
    cropNotes.push(`Current crop: ${crop.cropName} (${crop.growthStage} stage)`);
    if (crop.growthStage === "flowering" || crop.growthStage === "fruiting") {
      cropNotes.push(`${crop.cropName} is in ${crop.growthStage} stage. Nutrient support may be needed.`);
    }
  }
  if (avgSoilMoisture < 30) cropNotes.push("Moisture has remained low. Consider increasing irrigation.");
  if (avgTemperature > 33) cropNotes.push("Temperature stress risk observed this week.");
  if (cropNotes.length === 0) cropNotes.push("Farm conditions are stable.");

  res.json({
    avgSoilMoisture: Math.round(avgSoilMoisture * 10) / 10,
    avgTemperature: Math.round(avgTemperature * 10) / 10,
    avgHumidity: Math.round(avgHumidity * 10) / 10,
    avgLightIntensity: Math.round(avgLightIntensity * 10) / 10,
    avgWaterLevel: Math.round(avgWaterLevel * 10) / 10,
    farmCondition,
    cropNotes,
    totalReadings: readings.length,
    activeAlerts,
  });
});

export default router;
