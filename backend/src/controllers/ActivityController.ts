import type { Request, Response } from "express";
import { z } from "zod";
import { ActivityService } from "../services/ActivityService.js";
import { UserModel } from "../models/User.js";
import { insertActivitySchema } from "../shared/schema.js";

export class ActivityController {
  private static async getCurrentUser() {
    try {
      // Try to get the first available user from the database
      const users = await UserModel.findAll();
      if (users.length > 0) {
        return {
          id: users[0].id,
          role: 'admin_staff'
        };
      }
    } catch (error) {
      console.warn('Failed to get user from database:', error);
    }

    // Fallback to hardcoded user
    return {
      id: 'admin1',
      role: 'admin_staff'
    };
  }

  static async getActivities(req: Request, res: Response) {
    try {
      const { entityType, entityId } = req.params;
      // Accept both string UUIDs and numeric IDs
      const activities = await ActivityService.getActivities(entityType, entityId);
      res.json(activities);
    } catch (error) {
      console.error("Get activities error:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  }

  static async createActivity(req: Request, res: Response) {
    try {
      const currentUser = await ActivityController.getCurrentUser();
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
