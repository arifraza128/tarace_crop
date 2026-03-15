import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, alertsTable } from "@workspace/db";
import { ResolveAlertParams } from "@workspace/api-zod";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/alerts", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const status = req.query.status as string | undefined;

  let query = db
    .select()
    .from(alertsTable)
    .where(eq(alertsTable.userId, req.userId!))
    .orderBy(desc(alertsTable.createdAt))
    .$dynamic();

  if (status) {
    query = db
      .select()
      .from(alertsTable)
      .where(and(eq(alertsTable.userId, req.userId!), eq(alertsTable.status, status)))
      .orderBy(desc(alertsTable.createdAt))
      .$dynamic();
  }

  const alerts = await query.limit(100);
  res.json(alerts);
});

router.put("/alerts/:id/resolve", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const params = ResolveAlertParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [alert] = await db
    .update(alertsTable)
    .set({ status: "resolved" })
    .where(and(eq(alertsTable.id, params.data.id), eq(alertsTable.userId, req.userId!)))
    .returning();

  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json(alert);
});

export default router;
