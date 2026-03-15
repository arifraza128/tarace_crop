import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import farmRouter from "./farm.js";
import cropsRouter from "./crops.js";
import readingsRouter from "./readings.js";
import alertsRouter from "./alerts.js";
import recommendationsRouter from "./recommendations.js";
import devicesRouter from "./devices.js";
import analyticsRouter from "./analytics.js";
import pricesRouter from "./prices.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(farmRouter);
router.use(cropsRouter);
router.use(readingsRouter);
router.use(alertsRouter);
router.use(recommendationsRouter);
router.use(devicesRouter);
router.use(analyticsRouter);
router.use(pricesRouter);

export default router;
