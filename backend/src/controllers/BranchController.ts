import type { Request, Response } from 'express';
import { connection } from '../config/database.js';

export class BranchController {
  static async list(req: Request, res: Response) {
    try {
      const q = (req.query.q as string | undefined)?.trim();
      const limitParam = Number.parseInt(String(req.query.limit || ''), 10);
      const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : undefined;

      const params: any[] = [];
      let whereClause = '';
      if (q && q.length > 0) {
        whereClause = `WHERE branch_name LIKE ? OR city LIKE ? OR country LIKE ?`;
        const like = `%${q}%`;
        params.push(like, like, like);
      }

      const sql = `SELECT id,
              branch_name as branchName,
              city,
              country,
              address,
              official_phone as officialPhone,
              official_email as officialEmail,
              branch_head_id as branchHeadId,
              created_on as createdOn,
              updated_on as updatedOn
         FROM branches
         ${whereClause}
         ORDER BY branch_name${limit ? ' LIMIT ?' : ''}`;

      if (limit) params.push(limit);

      const [rows] = await connection.query<any[]>(sql, params);
      res.json(rows);
    } catch (e) {
      console.error('Failed to list branches', e);
      res.status(500).json({ message: 'Failed to list branches' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { name, city, country, address, officialPhone, officialEmail, managerId } = req.body || {};

      if (!name || !city || !country || !address || !officialPhone || !officialEmail) {
        return res.status(400).json({ message: 'name, city, country, address, officialPhone and officialEmail are required' });
      }

      const id = (await import('uuid')).v4();

      await connection.query(
        `INSERT INTO branches (id, branch_name, city, country, address, official_phone, official_email, branch_head_id, created_on, updated_on)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [id, name, city, country, address, officialPhone, officialEmail, managerId || null]
      );

      res.status(201).json({
        id,
        branchName: name,
        city,
        country,
        address,
        officialPhone,
        officialEmail,
        branchHeadId: managerId || null,
        createdOn: new Date(),
        updatedOn: new Date(),
      });
    } catch (e) {
      console.error('Failed to create branch', e);
      res.status(500).json({ message: 'Failed to create branch' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params as any;
      const { name, city, country, address, officialPhone, officialEmail, managerId } = req.body || {};

      if (!id) {
        return res.status(400).json({ message: 'id is required' });
      }
      if (!name || !city || !country || !address || !officialPhone || !officialEmail) {
        return res.status(400).json({ message: 'name, city, country, address, officialPhone and officialEmail are required' });
      }

      const [result] = await connection.query<any>(
        `UPDATE branches
         SET branch_name = ?, city = ?, country = ?, address = ?, official_phone = ?, official_email = ?, branch_head_id = ?, updated_on = NOW()
         WHERE id = ?`,
        [name, city, country, address, officialPhone, officialEmail, managerId || null, id]
      );

      if ((result as any)?.affectedRows === 0) {
        return res.status(404).json({ message: 'Branch not found' });
      }

      res.json({
        id,
        branchName: name,
        city,
        country,
        address,
        officialPhone,
        officialEmail,
        branchHeadId: managerId || null,
        updatedOn: new Date(),
      });
    } catch (e) {
      console.error('Failed to update branch', e);
      res.status(500).json({ message: 'Failed to update branch' });
    }
  }
}
