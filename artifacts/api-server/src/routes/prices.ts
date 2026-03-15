import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, priceDataTable } from "@workspace/db";
import {
  CreatePriceEntryBody,
  GetPricesQueryParams,
  GetPricePredictionParams,
  DeletePriceEntryParams,
} from "@workspace/api-zod";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";
import { predictPrice } from "../lib/pricePredictor.js";

const router: IRouter = Router();

router.get("/prices", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const query = GetPricesQueryParams.safeParse(req.query);
  const limit = (query.success && query.data.limit) ? query.data.limit : 100;
  const cropName = (query.success && query.data.cropName) ? query.data.cropName : undefined;

  let rows;
  if (cropName) {
    rows = await db
      .select()
      .from(priceDataTable)
      .where(and(eq(priceDataTable.userId, req.userId!), eq(priceDataTable.cropName, cropName)))
      .orderBy(desc(priceDataTable.createdAt))
      .limit(limit);
  } else {
    rows = await db
      .select()
      .from(priceDataTable)
      .where(eq(priceDataTable.userId, req.userId!))
      .orderBy(desc(priceDataTable.createdAt))
      .limit(limit);
  }

  res.json(rows);
});

router.post("/prices", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreatePriceEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db
    .insert(priceDataTable)
    .values({
      userId: req.userId!,
      cropName: parsed.data.cropName,
      pricePerKg: parsed.data.pricePerKg,
      marketName: parsed.data.marketName ?? "Local Market",
      unit: parsed.data.unit ?? "kg",
      notes: parsed.data.notes ?? null,
    })
    .returning();

  res.status(201).json(entry);
});

router.get("/prices/summary", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const allEntries = await db
    .select()
    .from(priceDataTable)
    .where(eq(priceDataTable.userId, req.userId!))
    .orderBy(desc(priceDataTable.createdAt));

  // Group by crop name
  const grouped: Record<string, typeof allEntries> = {};
  for (const entry of allEntries) {
    if (!grouped[entry.cropName]) grouped[entry.cropName] = [];
    grouped[entry.cropName].push(entry);
  }

  const summary = Object.entries(grouped).map(([cropName, entries]) => {
    const latestEntry = entries[0]; // already sorted desc
    const points = entries.map((e) => ({ price: e.pricePerKg, date: e.createdAt }));
    const prediction = predictPrice(points);

    return {
      cropName,
      latestPrice: latestEntry.pricePerKg,
      marketName: latestEntry.marketName,
      trend: prediction.trend,
      trendPercent: prediction.trendPercent,
      entryCount: entries.length,
    };
  });

  res.json(summary);
});

router.get("/prices/prediction/:cropName", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const params = GetPricePredictionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const entries = await db
    .select()
    .from(priceDataTable)
    .where(
      and(
        eq(priceDataTable.userId, req.userId!),
        eq(priceDataTable.cropName, params.data.cropName)
      )
    )
    .orderBy(desc(priceDataTable.createdAt))
    .limit(30);

  if (entries.length === 0) {
    res.status(404).json({ error: `No price data found for crop: ${params.data.cropName}` });
    return;
  }

  const points = entries.map((e) => ({ price: e.pricePerKg, date: e.createdAt }));
  const prediction = predictPrice(points);

  res.json({ cropName: params.data.cropName, ...prediction });
});

router.delete("/prices/:id", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const params = DeletePriceEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(priceDataTable)
    .where(and(eq(priceDataTable.id, params.data.id), eq(priceDataTable.userId, req.userId!)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Price entry not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
