import type { Request, Response } from "express";
import { UniversityCourseService } from "../services/UniversityCourseService.js";

export class UniversityCourseController {
  static async list(req: Request, res: Response) {
    try {
      const items = await UniversityCourseService.listAll();
      res.json({ data: items });
    } catch (e) {
      console.error('[UniversityCourseController] list error:', e);
      res.status(500).json({ message: 'Failed to fetch courses' });
    }
  }
}

export default UniversityCourseController;
