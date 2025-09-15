import { v4 as uuidv4 } from 'uuid';
import { connection } from "../config/database.js";

export interface ConfigurationRecord {
  id: string;
  name: string;
  data: any;
  created_by: string;
  updated_by: string;
  created_on: Date | string;
  updated_on: Date | string;
}

function parseJson(val: any) {
  if (val == null) return null;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

export class ConfigurationModel {
  static async findByName(name: string): Promise<ConfigurationRecord | undefined> {
    const [rows] = await connection.query<any[]>(
      'SELECT id, name, data, created_by, updated_by, created_on, updated_on FROM configurations WHERE name = ? ORDER BY updated_on DESC LIMIT 1',
      [name]
    );
    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] as any : undefined;
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      data: parseJson(row.data),
      created_by: row.created_by,
      updated_by: row.updated_by,
      created_on: row.created_on,
      updated_on: row.updated_on,
    } as ConfigurationRecord;
  }

  static async upsert(name: string, data: any, userId: string): Promise<ConfigurationRecord> {
    const existing = await ConfigurationModel.findByName(name);
    const now = new Date();
    if (existing) {
      await connection.query(
        'UPDATE configurations SET data = ?, updated_by = ?, updated_on = ? WHERE id = ?',
        [JSON.stringify(data), userId, now, existing.id]
      );
      return { ...existing, data, updated_by: userId, updated_on: now } as ConfigurationRecord;
    }
    const id = uuidv4();
    await connection.query(
      'INSERT INTO configurations (id, name, data, created_by, updated_by, created_on, updated_on) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, JSON.stringify(data), userId, userId, now, now]
    );
    return { id, name, data, created_by: userId, updated_by: userId, created_on: now, updated_on: now } as ConfigurationRecord;
  }
}
