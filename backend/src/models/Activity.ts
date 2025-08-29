import { eq, desc, and } from "drizzle-orm";
import { db } from "../config/database.js";
import { eq, and, desc } from "drizzle-orm";
import { activities, type Activity, type InsertActivity } from "../shared/schema.js";

export class ActivityModel {
  static async findById(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity;
  }

  static async findByEntity(entityType: string, entityId: string | number): Promise<Activity[]> {
    const entityIdStr = String(entityId); // Convert to string for consistency
    return db.select().from(activities)
      .where(
        and(
          eq(activities.entityType, entityType),
          eq(activities.entityId, entityIdStr)
        )
      )
      .orderBy(desc(activities.createdAt));
  }

  static async create(activityData: InsertActivity): Promise<Activity> {
    const result: any = await db.insert(activities).values(activityData);
    const insertId: number | undefined = result?.insertId ?? result?.[0]?.insertId;
    if (typeof insertId !== 'number') {
      // Fallback: fetch the most recent matching record as a last resort
      const rows = await db.select().from(activities)
        .where(
          and(
            eq(activities.entityType, activityData.entityType),
            eq(activities.entityId, String(activityData.entityId)),
            eq(activities.title, activityData.title)
          )
        )
        .orderBy(desc(activities.createdAt));
      if (rows.length > 0) return rows[0];
      throw new Error('Failed to retrieve inserted activity');
    }
    const created = await db.select().from(activities).where(eq(activities.id, insertId));
    return created[0]!;
  }

  static async bulkCreate(activitiesData: InsertActivity[]): Promise<Activity[]> {
    const created: Activity[] = [];
    for (const data of activitiesData) {
      const row = await this.create(data);
      created.push(row);
    }
    return created;
  }

  static async transferActivities(
    fromEntityType: string,
    fromEntityId: string | number,
    toEntityType: string,
    toEntityId: string | number
  ): Promise<void> {
    const fromEntityIdStr = String(fromEntityId);
    const toEntityIdStr = String(toEntityId);

    // Get all activities from the source entity
    const sourceActivities = await db.select().from(activities)
      .where(
        and(
          eq(activities.entityType, fromEntityType),
          eq(activities.entityId, fromEntityIdStr)
        )
      );

    // Create new activities for the target entity
    for (const activity of sourceActivities) {
      await db.insert(activities).values({
        entityType: toEntityType,
        entityId: toEntityIdStr,
        activityType: activity.activityType,
        title: activity.title,
        description: activity.description,
        oldValue: activity.oldValue,
        newValue: activity.newValue,
        fieldName: activity.fieldName,
        userId: activity.userId,
        userName: activity.userName,
        userProfileImage: activity.userProfileImage,
        createdAt: activity.createdAt,
      });
    }

    // Add a conversion activity
    await db.insert(activities).values({
      entityType: toEntityType,
      entityId: toEntityIdStr,
      activityType: 'converted',
      title: `Converted from ${fromEntityType}`,
      description: `This record was converted from ${fromEntityType} ID ${fromEntityIdStr}. All previous activities have been preserved.`,
      userName: "Next Bot",
    });
  }

  static async delete(id: number): Promise<boolean> {
    const result: any = await db.delete(activities).where(eq(activities.id, id));
    const affected = result?.affectedRows ?? result?.rowCount ?? 0;
    return affected > 0;
  }
}
