import type { Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middlewares/auth.js";
import { FollowUpService } from "../services/FollowUpService.js";

const querySchema = z.object({
  start: z.string(),
  end: z.string(),
  entityType: z.union([z.string(), z.array(z.string())]).optional(),
});

const MAX_RANGE_MS = 366 * 24 * 60 * 60 * 1000; // allow up to one year per request

export class FollowUpController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const parsed = querySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid query parameters",
          errors: parsed.error.flatten(),
        });
      }

      const { start, end, entityType } = parsed.data;
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid date range" });
      }
      if (startDate > endDate) {
        return res.status(400).json({ message: "Start date must be before end date" });
      }
      if (endDate.getTime() - startDate.getTime() > MAX_RANGE_MS) {
        return res.status(400).json({ message: "Date range exceeds maximum allowed window" });
      }

      let entityTypes: string[] | undefined;
      if (Array.isArray(entityType)) {
        entityTypes = entityType.flatMap((value) => String(value).split(","));
      } else if (typeof entityType === "string") {
        entityTypes = entityType.split(",");
      }
      if (entityTypes) {
        entityTypes = entityTypes
          .map((value) => value.trim())
          .filter((value) => value.length > 0);
        if (entityTypes.length === 0) {
          entityTypes = undefined;
        }
      }

      const followUps = await FollowUpService.listUserFollowUps({
        userId,
        start: startDate,
        end: endDate,
        entityTypes,
      });

      const data = followUps.map((item) => ({
        ...item,
        followUpOn: item.followUpOn instanceof Date ? item.followUpOn.toISOString() : new Date(item.followUpOn).toISOString(),
        createdOn: item.createdOn instanceof Date ? item.createdOn.toISOString() : new Date(item.createdOn).toISOString(),
        updatedOn: item.updatedOn instanceof Date ? item.updatedOn.toISOString() : new Date(item.updatedOn).toISOString(),
      }));

      return res.json({
        data,
        meta: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          total: data.length,
        },
      });
    } catch (error) {
      console.error("Failed to fetch follow-ups:", error);
      return res.status(500).json({ message: "Failed to fetch follow-ups" });
    }
  }
}
