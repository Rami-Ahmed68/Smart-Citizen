import { Router } from "express";
import { protect } from "../../middleware/protect/protect.js";
import { requirePermission } from "../../middleware/protect/permission.middleware.js";
import { dashboardLimiter } from "./dashboard.limiter.js";
import { GetDashboardStats } from "./dashboard.controller.js";

const DashboardRouter = Router();

DashboardRouter.use(protect("admin", "super"));

DashboardRouter.get(
  "/stats",
  requirePermission("read"),
  dashboardLimiter,
  GetDashboardStats,
);

export default DashboardRouter;
