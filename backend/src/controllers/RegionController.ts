import type { Request, Response } from 'express';
import { connection } from '../config/database.js';

export class RegionController {
  static async list(req: Request, res: Response) {
    try {
      const q = (req.query.q as string | undefined)?.trim();
      const limitParam = Number.parseInt(String(req.query.limit || ''), 10);
      const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : undefined;

      const params: any[] = [];
      let whereClause = '';
      if (q && q.length > 0) {
        whereClause = `WHERE region_name LIKE ?`;
        const like = `%${q}%`;
        params.push(like);
      }

      const limitClause = limit ? ` LIMIT ${limit}` : '';
      const sql = `SELECT 
              id,
              region_name AS regionName,
              region_head_id AS regionHeadId,
              created_on AS createdOn,
              updated_on AS updatedOn
            FROM regions
            ${whereClause}
            ORDER BY region_name${limitClause}`;
      const [rows] = await connection.query<any[]>(sql, params);
      res.json(rows);
    } catch (e) {
      console.error('Failed to list regions', e);
      res.status(500).json({ message: 'Failed to list regions' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { name, headId } = req.body || {};
      if (!name) {
        return res.status(400).json({ message: 'name is required' });
      }
      const id = (await import('uuid')).v4();
      await connection.query(
        `INSERT INTO regions (id, region_name, region_head_id, created_on, updated_on) VALUES (?, ?, ?, NOW(), NOW())`,
        [id, name, headId || null]
      );
      res.status(201).json({ id, regionName: name, regionHeadId: headId || null, createdOn: new Date(), updatedOn: new Date() });
    } catch (e) {
      console.error('Failed to create region', e);
      res.status(500).json({ message: 'Failed to create region' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params as any;
      const { name, headId } = req.body || {};
      if (!id) return res.status(400).json({ message: 'id is required' });
      if (!name) return res.status(400).json({ message: 'name is required' });

      const [result] = await connection.query<any>(
        `UPDATE regions SET region_name = ?, region_head_id = ?, updated_on = NOW() WHERE id = ?`,
        [name, headId || null, id]
      );
      if ((result as any)?.affectedRows === 0) {
        return res.status(404).json({ message: 'Region not found' });
      }
      res.json({ id, regionName: name, regionHeadId: headId || null, updatedOn: new Date() });
    } catch (e) {
      console.error('Failed to update region', e);
      res.status(500).json({ message: 'Failed to update region' });
    }
  }
}
