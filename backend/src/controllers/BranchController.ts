import type { Request, Response } from 'express';
import type { Request, Response } from 'express';
import { connection } from '../config/database.js';

export class BranchController {
  static async list(req: Request, res: Response) {
    try {
      const [rows] = await connection.query<any[]>(
        `SELECT id,
                branch_code as branchCode,
                branch_name as branchName,
                city,
                country,
                address,
                official_phone as officialPhone,
                official_email as officialEmail,
                branch_head_id as branchHeadId,
                status,
                created_on as createdOn,
                updated_on as updatedOn
         FROM branches
         ORDER BY branch_name`);
      res.json(rows);
    } catch (e) {
      console.error('Failed to list branches', e);
      res.status(500).json({ message: 'Failed to list branches' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { name, city, country, address, officialPhone, officialEmail, managerId, code, status } = req.body || {};

      if (!name || !city || !country || !address || !officialPhone || !officialEmail || !code || !status) {
        return res.status(400).json({ message: 'name, city, country, address, officialPhone, officialEmail, code and status are required' });
      }

      const id = (await import('uuid')).v4();

      await connection.query(
        `INSERT INTO branches (id, branch_code, branch_name, city, country, address, official_phone, official_email, branch_head_id, status, created_on, updated_on)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [id, code, name, city, country, address, officialPhone, officialEmail, managerId || null, status]
      );

      res.status(201).json({
        id,
        branchCode: code,
        branchName: name,
        city,
        country,
        address,
        officialPhone,
        officialEmail,
        branchHeadId: managerId || null,
        status,
        createdOn: new Date(),
        updatedOn: new Date(),
      });
    } catch (e) {
      console.error('Failed to create branch', e);
      res.status(500).json({ message: 'Failed to create branch' });
    }
  }
}
