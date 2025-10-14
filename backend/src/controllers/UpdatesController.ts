import type { Request, Response } from "express";
import { z } from "zod";
import { UpdateModel } from "../models/Update.js";

const createUpdateSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  subjectDesc: z.string().min(1, "Subject description is required"),
  body: z.string().min(1, "Body is required"),
});

export class UpdatesController {
  static async list(req: Request, res: Response) {
    try {
      const items = await UpdateModel.findAll();
      res.json(items);
    } catch (e) {
      console.error("Failed to list updates", e);
      res.status(500).json({ message: "Failed to fetch updates" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const data = createUpdateSchema.parse(req.body);
      const created = await UpdateModel.create(data as any);
      res.json(created);
    } catch (e: any) {
      console.error("Failed to create update", e);
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: e.errors });
      }
      res.status(500).json({ message: "Failed to create update" });
    }
  }
}
