import type { Request, Response } from "express";
import { UniversityCourseService } from "../services/UniversityCourseService.js";

export class UniversityCourseController {
  static async list(req: Request, res: Response) {
    try {
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const top = typeof req.query.top === 'string' ? (['top', 'non-top', 'all'].includes(req.query.top) ? req.query.top as any : undefined) : undefined;

      const result = await UniversityCourseService.list({ page, limit, q, category, top });
      res.json(result);
    } catch (e) {
      console.error('[UniversityCourseController] list error:', e);
      res.status(500).json({ message: 'Failed to fetch courses' });
    }
  }
}

export default UniversityCourseController;
