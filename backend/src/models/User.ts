import { eq, or, like, and, inArray } from "drizzle-orm";
import { db, connection } from "../config/database.js";
import { users, type User, type InsertUser } from "../shared/schema.js";
import { eq, desc } from "drizzle-orm";

export class UserModel {
  static async findById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  static async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  static async findByBranchId(branchId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.branchId, branchId));
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
    const [rows] = await connection.query<any[]>(
      'SELECT u.*, b.branch_name AS branchName FROM users u LEFT JOIN branches b ON u.branch_id = b.id WHERE u.role <> ? ORDER BY u.created_at DESC',
      ['system_admin']
    );
    return (rows as any[]);
  }

  static async searchUsers(searchQuery: string, roles?: string[], limit?: number): Promise<User[]> {
    const params: any[] = [];
    let sql = 'SELECT u.*, b.branch_name AS branchName FROM users u LEFT JOIN branches b ON u.branch_id = b.id WHERE (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)' ;
    const q = `%${searchQuery}%`;
    params.push(q, q, q);
    // Always exclude system_admin
    sql += ' AND u.role <> ?';
    params.push('system_admin');
    if (roles && roles.length > 0) {
      sql += ` AND u.role IN (${roles.map(() => '?').join(',')})`;
      params.push(...roles);
    }
    sql += ' ORDER BY u.created_at DESC';
    if (limit && Number.isFinite(limit)) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    const [rows] = await connection.query<any[]>(sql, params);
    return (rows as any[]);
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }
}
