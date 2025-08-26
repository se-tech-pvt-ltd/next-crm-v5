import { Router } from "express";
import { ActivityController } from "../controllers/ActivityController.js";

export const activityRoutes = Router();

activityRoutes.get("/:entityType/:entityId", ActivityController.getActivities);
activityRoutes.post("/", ActivityController.createActivity);
