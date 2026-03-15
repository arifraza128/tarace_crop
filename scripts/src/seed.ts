import { db, usersTable, farmsTable, cropsTable, devicesTable, sensorReadingsTable, alertsTable, recommendationsTable, priceDataTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, "demo@farm.com"));
  if (existingUser.length > 0) {
    console.log("Demo user already exists, skipping seed.");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash("password123", 10);
  const [user] = await db.insert(usersTable).values({
    name: "Ramu Farmer",
    email: "demo@farm.com",
    passwordHash,
  }).returning();
  console.log("Created user:", user.email);

  const [farm] = await db.insert(farmsTable).values({
    userId: user.id,
    farmerName: "Ramu Farmer",
    farmName: "Green Terrace Farm",
    location: "Himachal Pradesh, India",
    regionType: "hilly",
    terraceCount: 12,
    farmSize: "2.5 acres",
    soilType: "Loamy",
    waterSource: "Mountain spring + rainwater",
  }).returning();
  console.log("Created farm:", farm.farmName);

  const [crop] = await db.insert(cropsTable).values({
    userId: user.id,
    farmId: farm.id,
    cropName: "Tomato",
    cropType: "Vegetable",
    sowingDate: "2026-01-15",
    growthStage: "flowering",
    notes: "Local variety adapted to hilly terrain",
  }).returning();
  console.log("Created crop:", crop.cropName);

  await db.insert(cropsTable).values({
    userId: user.id,
    farmId: farm.id,
    cropName: "Wheat",
    cropType: "Cereal",
    sowingDate: "2025-11-01",
    growthStage: "harvesting",
    notes: "Winter wheat for terraces 1-5",
  });

  const [device] = await db.insert(devicesTable).values({
    userId: user.id,
    farmId: farm.id,
    deviceId: "ESP32-001",
    deviceName: "Main Field Sensor",
    deviceType: "ESP32",
    status: "offline",
  }).returning();
  console.log("Created device:", device.deviceId);

  const now = new Date();
  const readings = [];
  for (let i = 30; i >= 0; i--) {
    const ts = new Date(now.getTime() - i * 60 * 60 * 1000);
    readings.push({
      userId: user.id,
      farmId: farm.id,
      soilMoisture: 30 + Math.random() * 35,
      temperature: 22 + Math.random() * 12,
      humidity: 45 + Math.random() * 30,
      lightIntensity: 300 + Math.random() * 600,
      waterLevel: 40 + Math.random() * 40,
      sourceType: "demo",
      createdAt: ts,
    });
  }
  await db.insert(sensorReadingsTable).values(readings);
  console.log("Created", readings.length, "sensor readings");

  await db.insert(alertsTable).values([
    {
      userId: user.id,
      farmId: farm.id,
      title: "Low Soil Moisture",
      message: "Soil moisture dropped to 24%. Irrigation recommended.",
      severity: "medium",
      status: "active",
    },
    {
      userId: user.id,
      farmId: farm.id,
      title: "Crop Stress Warning",
      message: "Temperature is 36°C and humidity is 32%. High stress risk.",
      severity: "high",
      status: "active",
    },
    {
      userId: user.id,
      farmId: farm.id,
      title: "Low Water Level",
      message: "Water level at 18%. Check water storage.",
      severity: "medium",
      status: "resolved",
    },
  ]);
  console.log("Created alerts");

  await db.insert(recommendationsTable).values([
    {
      userId: user.id,
      farmId: farm.id,
      category: "irrigation",
      message: "Soil moisture is at 24%. Irrigation is recommended to prevent crop stress.",
    },
    {
      userId: user.id,
      farmId: farm.id,
      category: "crop",
      message: "Tomato is in flowering stage. Nutrient support and adequate water supply are important now.",
    },
    {
      userId: user.id,
      farmId: farm.id,
      category: "general",
      message: "Farm conditions are mostly stable. Continue regular monitoring.",
    },
  ]);
  console.log("Created recommendations");

  // Seed price data (simulate 2 weeks of entries for 3 crops)
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const priceEntries = [
    // Tomato - rising trend
    { userId: user.id, cropName: "Tomato", pricePerKg: 28.00, marketName: "Shimla Mandi", unit: "kg", notes: "Good quality", createdAt: new Date(now - 13 * day) },
    { userId: user.id, cropName: "Tomato", pricePerKg: 29.50, marketName: "Shimla Mandi", unit: "kg", notes: null, createdAt: new Date(now - 10 * day) },
    { userId: user.id, cropName: "Tomato", pricePerKg: 31.00, marketName: "Shimla Mandi", unit: "kg", notes: "High demand", createdAt: new Date(now - 7 * day) },
    { userId: user.id, cropName: "Tomato", pricePerKg: 33.50, marketName: "Shimla Mandi", unit: "kg", notes: null, createdAt: new Date(now - 4 * day) },
    { userId: user.id, cropName: "Tomato", pricePerKg: 36.00, marketName: "Shimla Mandi", unit: "kg", notes: "Festival season", createdAt: new Date(now - 1 * day) },
    // Potato - stable trend
    { userId: user.id, cropName: "Potato", pricePerKg: 18.00, marketName: "Local Mandi", unit: "kg", notes: null, createdAt: new Date(now - 12 * day) },
    { userId: user.id, cropName: "Potato", pricePerKg: 17.50, marketName: "Local Mandi", unit: "kg", notes: null, createdAt: new Date(now - 9 * day) },
    { userId: user.id, cropName: "Potato", pricePerKg: 18.50, marketName: "Local Mandi", unit: "kg", notes: null, createdAt: new Date(now - 6 * day) },
    { userId: user.id, cropName: "Potato", pricePerKg: 18.00, marketName: "Local Mandi", unit: "kg", notes: null, createdAt: new Date(now - 2 * day) },
    // Capsicum - falling trend
    { userId: user.id, cropName: "Capsicum", pricePerKg: 55.00, marketName: "Shimla Mandi", unit: "kg", notes: "Premium quality", createdAt: new Date(now - 11 * day) },
    { userId: user.id, cropName: "Capsicum", pricePerKg: 50.00, marketName: "Shimla Mandi", unit: "kg", notes: null, createdAt: new Date(now - 8 * day) },
    { userId: user.id, cropName: "Capsicum", pricePerKg: 46.00, marketName: "Shimla Mandi", unit: "kg", notes: "Oversupply", createdAt: new Date(now - 5 * day) },
    { userId: user.id, cropName: "Capsicum", pricePerKg: 42.00, marketName: "Shimla Mandi", unit: "kg", notes: null, createdAt: new Date(now - 2 * day) },
  ];

  await db.insert(priceDataTable).values(priceEntries);
  console.log("Created price entries");

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
