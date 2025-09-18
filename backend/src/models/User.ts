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
    // Find the first user linked to the branch via branch_emps
    const [row] = await connection.query<any[]>(
      'SELECT u.* FROM users u JOIN branch_emps be ON be.user_id = u.id WHERE be.branch_id = ? LIMIT 1',
      [branchId]
    );
    return (row && row.length > 0) ? (row[0] as any) : undefined;
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
    const [rows] = await connection.query<any[]>(
      'SELECT u.*, COALESCE(ur.role_name, u.role_id) AS role FROM users u LEFT JOIN user_roles ur ON ur.id = u.role_id WHERE COALESCE(ur.role_name, u.role_id) = ?'
      , ['counselor']
    );
    return (rows as any[]);
  }

  static async findAll(): Promise<User[]> {
    const [rows] = await connection.query<any[]>(
      'SELECT u.*, COALESCE(ur.role_name, u.role_id) AS role, COALESCE(be.branch_id, hb.id) as branchId, COALESCE(b.branch_name, hb.branch_name) AS branchName, a.path AS profileImageUrl FROM users u LEFT JOIN user_roles ur ON ur.id = u.role_id LEFT JOIN attachments a ON a.id = u.profile_image_id LEFT JOIN branch_emps be ON be.user_id = u.id LEFT JOIN branches b ON be.branch_id = b.id LEFT JOIN branches hb ON hb.branch_head_id = u.id WHERE COALESCE(ur.role_name, u.role_id) <> ? ORDER BY u.created_at DESC',
      ['system_admin']
    );
    return (rows as any[]);
  }

  static async searchUsers(searchQuery: string, roles?: string[], limit?: number): Promise<User[]> {
    const params: any[] = [];
    let sql = 'SELECT u.*, COALESCE(ur.role_name, u.role_id) AS role, COALESCE(be.branch_id, hb.id) as branchId, COALESCE(b.branch_name, hb.branch_name) AS branchName, a.path AS profileImageUrl FROM users u LEFT JOIN user_roles ur ON ur.id = u.role_id LEFT JOIN attachments a ON a.id = u.profile_image_id LEFT JOIN branch_emps be ON be.user_id = u.id LEFT JOIN branches b ON be.branch_id = b.id LEFT JOIN branches hb ON hb.branch_head_id = u.id WHERE (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
    const q = `%${searchQuery}%`;
    params.push(q, q, q);
    // Always exclude system_admin
    sql += ' AND COALESCE(ur.role_name, u.role_id) <> ?';
    params.push('system_admin');
    if (roles && roles.length > 0) {
      sql += ` AND COALESCE(ur.role_name, u.role_id) IN (${roles.map(() => '?').join(',')})`;
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
