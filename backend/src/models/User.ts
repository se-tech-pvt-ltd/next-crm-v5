import { eq } from "drizzle-orm";
import { db, connection } from "../config/database.js";
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
    await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id));
    return await UserModel.findById(id);
  }

  static async upsert(userData: InsertUser): Promise<User> {
    await db
      .insert(users)
      .values(userData)
      .onDuplicateKeyUpdate({
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      });
    const user = await UserModel.findById(userData.id);
    if (!user) throw new Error("Failed to upsert user");
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

  static async findSubPartnersByPartnerId(partnerId: string): Promise<User[]> {
    if (!partnerId) return [];
    const [rows] = await connection.query<any[]>(
      'SELECT u.*, COALESCE(ur.role_name, u.role_id) AS role, COALESCE(be.branch_id, hb.id) as branchId, COALESCE(b.branch_name, hb.branch_name) AS branchName, a.path AS profileImageUrl, sp.partner_id AS partnerId, sp.sub_partner_id AS subPartnerId FROM sub_partners sp INNER JOIN users u ON u.id = sp.sub_partner_id LEFT JOIN user_roles ur ON ur.id = u.role_id LEFT JOIN attachments a ON a.id = u.profile_image_id LEFT JOIN branch_emps be ON be.user_id = u.id LEFT JOIN branches b ON be.branch_id = b.id LEFT JOIN branches hb ON hb.branch_head_id = u.id WHERE sp.partner_id = ? AND COALESCE(ur.role_name, u.role_id) <> ? ORDER BY u.created_at DESC',
      [partnerId, 'system_admin']
    );
    const deduped = new Map<string, any>();
    for (const row of rows as any[]) {
      const id = String(row.id);
      if (!deduped.has(id)) {
        deduped.set(id, row);
        continue;
      }
      const existing = deduped.get(id);
      const existingBranch = existing?.branchId ?? existing?.branch_id ?? '';
      const incomingBranch = row?.branchId ?? row?.branch_id ?? '';
      const existingBranchName = existing?.branchName ?? existing?.branch_name ?? '';
      const incomingBranchName = row?.branchName ?? row?.branch_name ?? '';
      const shouldReplaceBranch = (!existingBranch || existingBranch === 'null') && incomingBranch;
      const shouldReplaceBranchName = (!existingBranchName || existingBranchName === 'null') && incomingBranchName;
      if (shouldReplaceBranch || shouldReplaceBranchName) {
        deduped.set(id, { ...existing, ...row });
      }
    }
    return Array.from(deduped.values()) as any[];
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
    const affected = (result as any)?.affectedRows ?? (result as any)?.rowCount ?? 0;
    return affected > 0;
  }
}
