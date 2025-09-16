import { connection } from "../config/database.js";

export interface TemplateRecord {
  id: string;
  name: string;
  type: string;
  template: string;
  created_by: string;
  updated_by: string;
  created_on: Date | string;
  updated_on: Date | string;
}

export class TemplateModel {
  static async findByName(name: string): Promise<TemplateRecord | undefined> {
    const [rows] = await connection.query<any[]>(
      'SELECT id, name, type, template, created_by, updated_by, created_on, updated_on FROM templates WHERE name = ? ORDER BY updated_on DESC LIMIT 1',
      [name]
    );
    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] as any : undefined;
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      template: row.template,
      created_by: row.created_by,
      updated_by: row.updated_by,
      created_on: row.created_on,
      updated_on: row.updated_on,
    } as TemplateRecord;
  }
}
