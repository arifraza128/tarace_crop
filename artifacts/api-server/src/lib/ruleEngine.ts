import { db, alertsTable, recommendationsTable, cropsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

interface ReadingData {
  soilMoisture: number;
  temperature: number;
  humidity: number;
  lightIntensity: number;
  waterLevel: number;
}

export async function runRuleEngine(
  userId: number,
  farmId: number | null,
  reading: ReadingData
): Promise<void> {
  const alerts: Array<{ title: string; message: string; severity: string }> = [];
  const recs: Array<{ category: string; message: string }> = [];

  if (reading.soilMoisture < 30) {
    alerts.push({
      title: "Low Soil Moisture",
      message: `Soil moisture is critically low at ${reading.soilMoisture.toFixed(1)}%. Irrigation is recommended immediately.`,
      severity: reading.soilMoisture < 20 ? "high" : "medium",
    });
    recs.push({
      category: "irrigation",
      message: `Soil moisture is at ${reading.soilMoisture.toFixed(1)}%. Irrigation is recommended to prevent crop stress.`,
    });
  }

  if (reading.temperature > 35 && reading.humidity < 40) {
    alerts.push({
      title: "Crop Stress Warning",
      message: `High temperature (${reading.temperature.toFixed(1)}°C) and low humidity (${reading.humidity.toFixed(1)}%) detected. Crop stress risk is high.`,
      severity: "high",
    });
    recs.push({
      category: "temperature",
      message: `Temperature is ${reading.temperature.toFixed(1)}°C and humidity is ${reading.humidity.toFixed(1)}%. Consider shade nets and increase irrigation frequency.`,
    });
  }

  if (reading.waterLevel < 25) {
    alerts.push({
      title: "Low Water Level",
      message: `Water level is at ${reading.waterLevel.toFixed(1)}%. Check water storage or source immediately.`,
      severity: reading.waterLevel < 15 ? "high" : "medium",
    });
    recs.push({
      category: "water",
      message: `Water level is dropping to ${reading.waterLevel.toFixed(1)}%. Inspect water source and storage tanks.`,
    });
  }

  if (reading.lightIntensity < 200) {
    alerts.push({
      title: "Low Sunlight",
      message: `Light intensity is only ${reading.lightIntensity.toFixed(0)} lux. Low sunlight may affect photosynthesis.`,
      severity: "low",
    });
    recs.push({
      category: "light",
      message: `Current light intensity is ${reading.lightIntensity.toFixed(0)} lux. Consider removing shade or adjusting terrace positioning.`,
    });
  } else if (reading.lightIntensity > 900) {
    alerts.push({
      title: "Excessive Sunlight",
      message: `Light intensity is ${reading.lightIntensity.toFixed(0)} lux. Excessive sunlight may burn crops.`,
      severity: "medium",
    });
    recs.push({
      category: "light",
      message: `Light intensity at ${reading.lightIntensity.toFixed(0)} lux is very high. Consider temporary shade nets to protect crops.`,
    });
  }

  const crops = await db
    .select()
    .from(cropsTable)
    .where(eq(cropsTable.userId, userId))
    .orderBy(desc(cropsTable.createdAt))
    .limit(1);

  if (crops.length > 0) {
    const crop = crops[0];
    if (crop.growthStage === "flowering" || crop.growthStage === "fruiting") {
      recs.push({
        category: "crop",
        message: `Current crop "${crop.cropName}" is in ${crop.growthStage} stage. Nutrient support and adequate water supply are important now.`,
      });
    } else if (crop.growthStage === "vegetative") {
      recs.push({
        category: "crop",
        message: `"${crop.cropName}" is in vegetative stage. Consider nitrogen-rich fertilizer application for healthy growth.`,
      });
    }
  }

  if (alerts.length === 0 && recs.length === 0) {
    recs.push({
      category: "general",
      message: "Farm conditions are stable. Continue regular monitoring and maintenance.",
    });
  }

  for (const alert of alerts) {
    await db.insert(alertsTable).values({
      userId,
      farmId,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      status: "active",
    });
  }

  for (const rec of recs) {
    await db.insert(recommendationsTable).values({
      userId,
      farmId,
      category: rec.category,
      message: rec.message,
    });
  }
}
