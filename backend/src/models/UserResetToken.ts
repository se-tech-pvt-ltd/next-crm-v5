import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "../config/database.js";
import { usersResetTokens } from "../shared/schema.js";

export type UserResetTokenRecord = typeof usersResetTokens.$inferSelect;
export type InsertUserResetToken = typeof usersResetTokens.$inferInsert;

type CreateUserResetTokenInput = Omit<InsertUserResetToken, "id" | "createdOn" | "updatedOn"> &
  Partial<Pick<InsertUserResetToken, "id" | "createdOn" | "updatedOn">>;

export class UserResetTokenModel {
  static async create(data: CreateUserResetTokenInput): Promise<UserResetTokenRecord> {
    const now = new Date();
    const id = data.id ?? randomUUID();

    const insertData: InsertUserResetToken = {
      ...data,
      id,
      createdOn: data.createdOn ?? now,
      updatedOn: data.updatedOn ?? now,
    };

    await db.insert(usersResetTokens).values(insertData);

    const [created] = await db
      .select()
      .from(usersResetTokens)
      .where(eq(usersResetTokens.id, id))
      .limit(1);

    if (!created) {
      throw new Error(`Failed to create reset token record for user ${data.userId}`);
    }

    return created;
  }

  static async invalidateTokensForUser(userId: string): Promise<void> {
    await db
      .update(usersResetTokens)
      .set({ isUsed: true, updatedOn: new Date() })
      .where(eq(usersResetTokens.userId, userId));
  }
}
