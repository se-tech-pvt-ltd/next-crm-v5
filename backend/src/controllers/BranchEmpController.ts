import type { Request, Response } from "express";
import { BranchEmpService } from "../services/BranchEmpService.js";

export class BranchEmpController {
  static async list(req: Request, res: Response) {
    try {
      const items = await BranchEmpService.listAll();
      res.json(items);
    } catch (e) {
      console.error('List branch emps error:', e);
      res.status(500).json({ message: 'Failed to list branch emps' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const item = await BranchEmpService.getById(id);
      if (!item) return res.status(404).json({ message: 'Not found' });
      res.json(item);
    } catch (e) {
      console.error('Get branch emp error:', e);
      res.status(500).json({ message: 'Failed to fetch branch emp' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const data = req.body;
      const created = await BranchEmpService.create(data);
      res.status(201).json(created);
    } catch (e: any) {
      console.error('Create branch emp error:', e);
      res.status(400).json({ message: e?.message || 'Failed to create' });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      await BranchEmpService.delete(id);
      res.json({ success: true });
    } catch (e: any) {
      console.error('Delete branch emp error:', e);
      res.status(500).json({ message: e?.message || 'Failed to delete' });
    }
  }
}
