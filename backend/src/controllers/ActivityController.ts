import type { Request, Response } from "express";
import { z } from "zod";
import { ActivityService } from "../services/ActivityService.js";
import { insertActivitySchema } from "../shared/schema.js";

export class ActivityController {
  private static getCurrentUser() {
    return {
      id: 'admin1',
      role: 'admin_staff'
    };
  }

  static async getActivities(req: Request, res: Response) {
    try {
      const { entityType, entityId } = req.params;
      const id = parseInt(entityId);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid entity ID" });
      }
      const activities = await ActivityService.getActivities(entityType, id);
      res.json(activities);
    } catch (error) {
      console.error("Get activities error:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  }

  static async createActivity(req: Request, res: Response) {
    try {
      const currentUser = ActivityController.getCurrentUser();
      const activityData = insertActivitySchema.parse(req.body);
      const activity = await ActivityService.createActivityWithUser(activityData, currentUser.id);
      res.json(activity);
    } catch (error) {
      console.error("Create activity error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create activity" });
    }
  }
}
