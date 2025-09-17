import { db } from "../config/database.js";
import { userDepartments } from "../shared/schema.js";
import { desc } from "drizzle-orm";

export class UserDepartmentModel {
  static async findAll(): Promise<any[]> {
    return await db.select().from(userDepartments).orderBy(desc(userDepartments.createdOn));
  }

  static async findById(id: string): Promise<any | undefined> {
    const [row] = await db.select().from(userDepartments).where((userDepartments.id as any).equals(id));
    return row;
  }
}
