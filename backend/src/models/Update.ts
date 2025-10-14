import { v4 as uuidv4 } from "uuid";
import { db } from "../config/database.js";
import { updates } from "../shared/schema.js";
import { desc, eq } from "drizzle-orm";

export type UpdateRecord = typeof updates.$inferSelect;
export type InsertUpdate = typeof updates.$inferInsert;

export class UpdateModel {
  static async create(data: InsertUpdate): Promise<UpdateRecord> {
    const id = data.id ?? uuidv4();
    const now = new Date();

    const toInsert: InsertUpdate = {
      ...data,
      id,
      createdOn: data.createdOn ?? (now as any),
      updatedOn: data.updatedOn ?? (now as any),
    } as InsertUpdate;

    await db.insert(updates).values(toInsert);

    const [created] = await db.select().from(updates).where(eq(updates.id, id)).limit(1);
    if (!created) throw new Error("Failed to create update");
    return created;
  }

  static async findAll(): Promise<UpdateRecord[]> {
    const rows = await db.select().from(updates).orderBy(desc(updates.createdOn));
    return rows;
  }
}
