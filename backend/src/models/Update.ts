import { v4 as uuidv4 } from "uuid";
import { db } from "../config/database.js";
import { updates } from "../shared/schema.js";
import { desc, eq } from "drizzle-orm";

export type UpdateRecord = typeof updates.$inferSelect;
export type InsertUpdate = typeof updates.$inferInsert;

export type CreateUpdateInput = Omit<InsertUpdate, "id" | "createdOn" | "updatedOn"> &
  Partial<Pick<InsertUpdate, "id" | "createdOn" | "updatedOn">>;

const normalizeImageIds = (ids: InsertUpdate["imageIds"] | undefined): InsertUpdate["imageIds"] => {
  if (!Array.isArray(ids)) {
    return [];
  }
  const filtered = ids
    .map((id) => (typeof id === "string" ? id.trim() : ""))
    .filter((id): id is string => id.length > 0);
  return Array.from(new Set(filtered));
};

export class UpdateModel {
  static async create(data: CreateUpdateInput): Promise<UpdateRecord> {
    const id = data.id ?? uuidv4();
    const now = new Date();

    const imageIds = normalizeImageIds(data.imageIds);

    const toInsert: InsertUpdate = {
      ...data,
      id,
      imageIds,
      createdOn: (data.createdOn as InsertUpdate["createdOn"]) ?? (now as any),
      updatedOn: (data.updatedOn as InsertUpdate["updatedOn"]) ?? (now as any),
    };

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
