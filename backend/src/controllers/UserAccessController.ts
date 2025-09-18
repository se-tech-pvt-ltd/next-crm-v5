import type { Request, Response } from "express";
import { z } from "zod";
import { UserAccessService } from "../services/UserAccessService.js";
import { insertUserAccessSchema } from "../shared/schema.js";

export class UserAccessController {
  static async list(req: Request, res: Response) {
    try {
      const rows = await UserAccessService.listAccess();
      res.json(rows);
    } catch (err) {
      console.error("List user access error:", err);
      res.status(500).json({ message: "Failed to list user access" });
    }
  }

  static async get(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ message: "ID is required" });
      const row = await UserAccessService.getAccess(id);
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json(row);
    } catch (err) {
      console.error("Get user access error:", err);
      res.status(500).json({ message: "Failed to get user access" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const data = insertUserAccessSchema.parse(req.body);
      const created = await UserAccessService.createAccess(data);
      res.json(created);
    } catch (err) {
      console.error("Create user access error:", err);
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      res.status(500).json({ message: "Failed to create user access" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ message: "ID is required" });
      const data = req.body as any;
      const updated = await UserAccessService.updateAccess(id, data);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err) {
      console.error("Update user access error:", err);
      res.status(500).json({ message: "Failed to update user access" });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ message: "ID is required" });
      const success = await UserAccessService.deleteAccess(id);
      if (success) res.json({ message: "Deleted" }); else res.status(404).json({ message: "Not found" });
    } catch (err) {
      console.error("Delete user access error:", err);
      res.status(500).json({ message: "Failed to delete user access" });
    }
  }
}
