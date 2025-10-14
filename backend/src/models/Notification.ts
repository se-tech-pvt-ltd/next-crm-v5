import { v4 as uuidv4 } from "uuid";
import { v4 as uuidv4 } from "uuid";
import { db } from "../config/database.js";
import { notifications } from "../shared/schema.js";
import { eq } from "drizzle-orm";

export type NotificationRecord = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type NotificationStatus = NotificationRecord["status"];

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

  static async updateStatus(
    id: string,
    status: NotificationStatus,
    options?: { sentAt?: Date | null }
  ): Promise<NotificationRecord | null> {
    const now = new Date();
    const payload: Partial<InsertNotification> = {
      status,
      updatedAt: now,
    };

    if (status === "sent") {
      payload.sentAt = options?.sentAt ?? now;
    } else if (options?.sentAt !== undefined) {
      payload.sentAt = options.sentAt;
    }

    const result = await db
      .update(notifications)
      .set(payload)
      .where(eq(notifications.id, id));

    const affected =
      (result as any)?.affectedRows ??
      (result as any)?.rowCount ??
      (result as any)?.rowsAffected ??
      0;

    if (!affected) {
      return null;
    }

    const [updated] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    return updated ?? null;
  }
}
