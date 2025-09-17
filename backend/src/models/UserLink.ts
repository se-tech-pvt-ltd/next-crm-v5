import { db } from "../config/database.js";
import { branchEmps } from "../shared/schema.js";
import { eq, desc } from "drizzle-orm";

export class BranchEmpModel {
  static async findAll(): Promise<any[]> {
    return await db.select().from(branchEmps).orderBy(desc(branchEmps.createdOn));
  }

  static async findById(id: string): Promise<any | undefined> {
    const [row] = await db.select().from(branchEmps).where(eq(branchEmps.id, id));
    return row;
  }

  static async findByBranch(branchId: string): Promise<any[]> {
    return await db.select().from(branchEmps).where(eq(branchEmps.branchId, branchId)).orderBy(desc(branchEmps.createdOn));
  }

  static async findByUser(userId: string): Promise<any[]> {
    return await db.select().from(branchEmps).where(eq(branchEmps.userId, userId)).orderBy(desc(branchEmps.createdOn));
  }

  static async create(data: any): Promise<void> {
    await db.insert(branchEmps).values(data);
  }
}
