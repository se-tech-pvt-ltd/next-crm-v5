import { v4 as uuidv4 } from "uuid";
import { db } from "../config/database.js";
import { notifications } from "../shared/schema.js";
import { eq } from "drizzle-orm";

export type NotificationRecord = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export class NotificationModel {
  static async create(notificationData: InsertNotification): Promise<NotificationRecord> {
    const notificationId = notificationData.id ?? uuidv4();
    const now = new Date();

    const values: InsertNotification = {
      ...notificationData,
      id: notificationId,
      createdAt: notificationData.createdAt ?? now,
      updatedAt: notificationData.updatedAt ?? now,
    };

    await db.insert(notifications).values(values);

    const [created] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    if (!created) {
      throw new Error(`Failed to create notification with ID: ${notificationId}`);
    }

    return created;
  }
}
