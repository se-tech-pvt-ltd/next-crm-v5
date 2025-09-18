import { db } from "../config/database.js";
import { userRoles } from "../shared/schema.js";
import { eq, desc } from "drizzle-orm";

export class UserRoleModel {
  static async findAll(): Promise<any[]> {
    return await db.select().from(userRoles).orderBy(desc(userRoles.createdOn));
  }

  static async findByDepartmentId(departmentId: string): Promise<any[]> {
    if (!departmentId) return [];
    return await db.select().from(userRoles).where(eq(userRoles.departmentId, departmentId)).orderBy(desc(userRoles.createdOn));
  }

  static async findById(id: string): Promise<any | undefined> {
    const [row] = await db.select().from(userRoles).where(eq(userRoles.id, id));
    return row;
  }

  static async findByRoleName(name: string): Promise<any | undefined> {
    const [row] = await db.select().from(userRoles).where(eq(userRoles.roleName, name));
    return row;
  }
}
