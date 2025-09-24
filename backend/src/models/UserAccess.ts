import { eq } from "drizzle-orm";
import { db } from "../config/database.js";
import { userAccess, type UserAccess, type InsertUserAccess } from "../shared/schema.js";

export class UserAccessModel {
  static async findAll(): Promise<UserAccess[]> {
    return await db.select().from(userAccess);
  }

  static async findByRoleId(roleId: string): Promise<UserAccess[]> {
    return await db.select().from(userAccess).where(eq(userAccess.roleId, roleId));
  }

  static async findById(id: string): Promise<UserAccess | undefined> {
    const [row] = await db.select().from(userAccess).where(eq(userAccess.id, id));
    return row;
  }

  static async create(data: InsertUserAccess): Promise<UserAccess> {
    await db.insert(userAccess).values(data);
    const [row] = await db.select().from(userAccess).where(eq(userAccess.id, data.id));
    if (!row) throw new Error("Failed to create user access");
    return row;
  }

  static async update(id: string, data: Partial<InsertUserAccess>): Promise<UserAccess | null> {
    await db.update(userAccess).set({ ...data }).where(eq(userAccess.id, id));
    const [row] = await db.select().from(userAccess).where(eq(userAccess.id, id));
    return row || null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db.delete(userAccess).where(eq(userAccess.id, id));
    const affected = (result as any)?.affectedRows ?? (result as any)?.rowCount ?? 0;
    return affected > 0;
  }
}
