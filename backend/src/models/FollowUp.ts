import { randomUUID } from "node:crypto";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../config/database.js";
import { followUps, type FollowUp, type InsertFollowUp } from "../shared/schema.js";

export class FollowUpModel {
  static async create(data: InsertFollowUp): Promise<FollowUp> {
    const id = data.id ?? randomUUID();
    const payload: InsertFollowUp = {
      ...data,
      id,
      userId: String(data.userId),
      entityId: String(data.entityId),
      entityType: String(data.entityType),
      comments: data.comments,
      followUpOn: data.followUpOn,
    };

    await db.insert(followUps).values(payload);

    const [created] = await db.select().from(followUps).where(eq(followUps.id, id));
    if (!created) {
      throw new Error("Failed to persist follow-up record");
    }

    return created;
  }

  static async findByUserAndRange(userId: string, start: Date, end: Date): Promise<FollowUp[]> {
    return await db
      .select()
      .from(followUps)
      .where(
        and(
          eq(followUps.userId, String(userId)),
          gte(followUps.followUpOn, start),
          lte(followUps.followUpOn, end),
        ),
      )
      .orderBy(asc(followUps.followUpOn));
  }
}
