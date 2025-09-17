import type { Request, Response } from "express";
import { UserRoleService } from "../services/UserRoleService.js";

export class UserRoleController {
  static async listDepartments(req: Request, res: Response) {
    try {
      const items = await UserRoleService.listDepartments();
      res.json(items);
    } catch (e) {
      console.error('List departments error:', e);
      res.status(500).json({ message: 'Failed to list departments' });
    }
  }

  static async listRoles(req: Request, res: Response) {
    try {
      const { departmentId } = req.query as { departmentId?: string };
      const items = await UserRoleService.listRoles(departmentId);
      res.json(items);
    } catch (e) {
      console.error('List roles error:', e);
      res.status(500).json({ message: 'Failed to list roles' });
    }
  }
}
