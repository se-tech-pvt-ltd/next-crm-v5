import { UniversityService } from "../services/UniversityService.js";
import { Request, Response } from "express";

export class universityController {
  static async list(req: Request, res: Response) {
    try {
      const items = await UniversityService.getUniversities();
      res.json(items);
    } catch (e) {
      console.error('Get universities error:', e);
      res.status(500).json({ message: "Failed to fetch universities" });
    }
  }
  static async getById(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const item = await UniversityService.getUniversityById(id);
      if (!item) {
        return res.status(404).json({ message: "University not found" });
      }
      res.json(item);
    } catch (e) {
      console.error('Get university by ID error:', e);
      res.status(500).json({ message: "Failed to fetch university" });
    }
  }
}
