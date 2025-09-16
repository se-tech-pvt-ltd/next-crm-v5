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
        whereClause = `WHERE b.branch_name LIKE ? OR b.city LIKE ? OR b.country LIKE ? OR r.region_name LIKE ?`;
        const like = `%${q}%`;
        params.push(like, like, like, like);
      }

      const limitClause = limit ? ` LIMIT ${limit}` : '';
      const sql = `SELECT
              b.id,
              b.branch_name as branchName,
              b.city,
              b.country,
              b.address,
              b.official_phone as officialPhone,
              b.official_email as officialEmail,
              b.branch_region as regionId,
              r.region_name as regionName,
              b.branch_head_id as branchHeadId,
              b.created_on as createdOn,
              b.updated_on as updatedOn
         FROM branches b
         LEFT JOIN regions r ON r.id = b.branch_region
         ${whereClause}
         ORDER BY b.branch_name${limitClause}`;

      const [rows] = await connection.query<any[]>(sql, params);
      res.json(rows);
    } catch (e) {
      console.error('Failed to list branches', e);
      res.status(500).json({ message: 'Failed to list branches' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { name, city, country, address, officialPhone, officialEmail, managerId, regionId } = req.body || {};

      if (!name || !city || !country || !address || !officialPhone || !officialEmail) {
        return res.status(400).json({ message: 'name, city, country, address, officialPhone and officialEmail are required' });
      }

      const id = (await import('uuid')).v4();

      if (managerId) {
        const [bHeadRows] = await connection.query<any[]>(
          `SELECT id, branch_name FROM branches WHERE branch_head_id = ? LIMIT 1`,
          [managerId]
        );
        if (Array.isArray(bHeadRows) && bHeadRows.length > 0) {
          return res.status(400).json({ message: 'User is already head of another branch' });
        }
        const [rHeadRows] = await connection.query<any[]>(
          `SELECT id, region_name FROM regions WHERE region_head_id = ? LIMIT 1`,
          [managerId]
        );
        if (Array.isArray(rHeadRows) && rHeadRows.length > 0) {
          return res.status(400).json({ message: 'User is already head of a region' });
        }
      }

      await connection.query(
        `INSERT INTO branches (id, branch_name, branch_region, city, country, address, official_phone, official_email, branch_head_id, created_on, updated_on)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [id, name, regionId || null, city, country, address, officialPhone, officialEmail, managerId || null]
      );

      res.status(201).json({
        id,
        branchName: name,
        city,
        country,
        address,
        officialPhone,
        officialEmail,
        regionId: regionId || null,
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
      const { name, city, country, address, officialPhone, officialEmail, managerId, regionId } = req.body || {};

      if (!id) {
        return res.status(400).json({ message: 'id is required' });
      }
      if (!name || !city || !country || !address || !officialPhone || !officialEmail) {
        return res.status(400).json({ message: 'name, city, country, address, officialPhone and officialEmail are required' });
      }

      if (managerId) {
        const [bHeadRows] = await connection.query<any[]>(
          `SELECT id FROM branches WHERE branch_head_id = ? AND id <> ? LIMIT 1`,
          [managerId, id]
        );
        if (Array.isArray(bHeadRows) && bHeadRows.length > 0) {
          return res.status(400).json({ message: 'User is already head of another branch' });
        }
        const [rHeadRows] = await connection.query<any[]>(
          `SELECT id FROM regions WHERE region_head_id = ? LIMIT 1`,
          [managerId]
        );
        if (Array.isArray(rHeadRows) && rHeadRows.length > 0) {
          return res.status(400).json({ message: 'User is already head of a region' });
        }
      }

      const [result] = await connection.query<any>(
        `UPDATE branches
         SET branch_name = ?, branch_region = ?, city = ?, country = ?, address = ?, official_phone = ?, official_email = ?, branch_head_id = ?, updated_on = NOW()
         WHERE id = ?`,
        [name, regionId || null, city, country, address, officialPhone, officialEmail, managerId || null, id]
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
        regionId: regionId || null,
        branchHeadId: managerId || null,
        updatedOn: new Date(),
      });
    } catch (e) {
      console.error('Failed to update branch', e);
      res.status(500).json({ message: 'Failed to update branch' });
    }
  }
}
