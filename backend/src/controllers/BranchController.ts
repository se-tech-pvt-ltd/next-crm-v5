import type { Request, Response } from 'express';
import { connection } from '../config/database.js';

export class BranchController {
  static async list(req: Request, res: Response) {
    try {
      const [rows] = await connection.query<any[]>(
        `SELECT id, branch_name as branchName, city, country, address, official_phone as officialPhone, official_email as officialEmail, branch_head_id as branchHeadId, created_on as createdOn, updated_on as updatedOn FROM branches ORDER BY branch_name`);
      res.json(rows);
    } catch (e) {
      console.error('Failed to list branches', e);
      res.status(500).json({ message: 'Failed to list branches' });
    }
  }
}
