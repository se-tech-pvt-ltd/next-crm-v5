import { eq, desc, and } from "drizzle-orm";
import { db } from "../config/database.js";
import { activities, type Activity, type InsertActivity } from "../shared/schema.js";

export class ActivityModel {
  static async findById(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity;
  }

  static async findByEntity(entityType: string, entityId: number): Promise<Activity[]> {
    return db.select().from(activities)
      .where(
        and(
          eq(activities.entityType, entityType),
          eq(activities.entityId, entityId)
        )
      )
      .orderBy(desc(activities.createdAt));
  }

  static async create(activityData: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(activityData)
      .returning();
    return activity;
  }

  static async bulkCreate(activitiesData: InsertActivity[]): Promise<Activity[]> {
    return await db
      .insert(activities)
      .values(activitiesData)
      .returning();
  }

  static async transferActivities(
    fromEntityType: string, 
    fromEntityId: number, 
    toEntityType: string, 
    toEntityId: number
  ): Promise<void> {
    // Get all activities from the source entity
    const sourceActivities = await db.select().from(activities)
      .where(
        and(
          eq(activities.entityType, fromEntityType),
          eq(activities.entityId, fromEntityId)
        )
      );

    // Create new activities for the target entity
    for (const activity of sourceActivities) {
      await db.insert(activities).values({
        entityType: toEntityType,
        entityId: toEntityId,
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
      entityId: toEntityId,
      activityType: 'converted',
      title: `Converted from ${fromEntityType}`,
      description: `This record was converted from ${fromEntityType} ID ${fromEntityId}. All previous activities have been preserved.`,
      userName: "Next Bot",
    });
  }

  static async delete(id: number): Promise<boolean> {
    const result = await db.delete(activities).where(eq(activities.id, id));
    return (result.rowCount || 0) > 0;
  }
}
