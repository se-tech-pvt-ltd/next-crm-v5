import { Router } from "express";
import { ActivityController } from "../controllers/ActivityController.js";
import { requireAuth } from "../middlewares/auth.js";

export const activityRoutes = Router();

activityRoutes.get("/:entityType/:entityId", ActivityController.getActivities);
activityRoutes.post("/", requireAuth, ActivityController.createActivity);
