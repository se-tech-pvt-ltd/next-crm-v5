import { db } from "../config/database.js";
import { userLink } from "../shared/schema.js";
import { eq, desc } from "drizzle-orm";

export class UserLinkModel {
  static async findAll(): Promise<any[]> {
    return await db.select().from(userLink).orderBy(desc(userLink.createdOn));
  }

  static async findById(id: string): Promise<any | undefined> {
    const [row] = await db.select().from(userLink).where(eq(userLink.id, id));
    return row;
  }

  static async findByRegion(regionId: string): Promise<any[]> {
    return await db.select().from(userLink).where(eq(userLink.regionId, regionId)).orderBy(desc(userLink.createdOn));
  }

  static async create(data: any): Promise<void> {
    await db.insert(userLink).values(data);
  }
}
