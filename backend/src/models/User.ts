import { eq, or, like, and, inArray } from "drizzle-orm";
import { db } from "../config/database.js";
import { users, type User, type InsertUser } from "../shared/schema.js";

export class UserModel {
  static async findById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  static async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  static async create(userData: InsertUser): Promise<User> {
    const result = await db.insert(users).values(userData);

    // For user, we use the provided ID since it's a string primary key
    const createdUser = await UserModel.findById(userData.id);

    if (!createdUser) {
      throw new Error("Failed to create user - record not found after insert");
    }

    return createdUser;
  }

  static async update(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  static async upsert(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  static async findCounselors(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'counselor'));
  }

  static async findAll(): Promise<User[]> {
    return await db.select().from(users);
  }

  static async searchUsers(searchQuery: string, roles?: string[], limit?: number): Promise<User[]> {
    const searchPattern = `%${searchQuery}%`;

    // Build the search condition
    const searchCondition = or(
      like(users.firstName, searchPattern),
      like(users.lastName, searchPattern),
      like(users.email, searchPattern)
    );

    // Build the role condition if provided
    const roleCondition = roles && roles.length > 0 ? inArray(users.role, roles) : undefined;

    // Combine conditions
    const whereCondition = roleCondition
      ? and(searchCondition, roleCondition)
      : searchCondition;

    let query = db
      .select()
      .from(users)
      .where(whereCondition);

    // Apply limit if provided
    if (limit) {
      query = query.limit(limit);
    }

    return await query;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }
}
