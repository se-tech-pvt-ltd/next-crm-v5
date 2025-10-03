import { NotificationModel, type InsertNotification } from "../models/Notification.js";
import { NotificationModel, type InsertNotification } from "../models/Notification.js";
import { type Lead } from "../shared/schema.js";

const LEAD_CREATION_TEMPLATE_ID = "nxtcrm_lead_creation";

type QueueNotificationInput = {
  entityType: string;
  entityId: string | number;
  templateId: string;
  channel: string;
  variables?: Record<string, unknown>;
  recipientAddress?: string | null;
  scheduledAt?: Date | null;
  status?: InsertNotification["status"];
  createdAt?: Date;
  updatedAt?: Date;
};

export class NotificationService {
  static async queueNotification(payload: QueueNotificationInput): Promise<void> {
    try {
      const now = new Date();
      const scheduledAt = payload.scheduledAt ?? now;

      await NotificationModel.create({
        entityType: payload.entityType,
        entityId: String(payload.entityId),
        templateId: payload.templateId,
        channel: payload.channel,
        status: payload.status ?? "pending",
        variables: (payload.variables ?? {}) as InsertNotification["variables"],
        recipientAddress: payload.recipientAddress ?? null,
        scheduledAt,
        createdAt: payload.createdAt ?? now,
        updatedAt: payload.updatedAt ?? now,
      });
    } catch (error) {
      console.error("[NotificationService] Failed to queue notification:", error);
    }
  }

  static async queueLeadCreationNotification(lead: Lead): Promise<void> {
    try {
      if (!lead?.id) {
        return;
      }

      await NotificationService.queueNotification({
        entityType: "lead",
        entityId: lead.id,
        templateId: LEAD_CREATION_TEMPLATE_ID,
        channel: "whatsapp",
        variables: {
          lead_name: lead.name ?? "",
        },
        recipientAddress: lead.phone ?? null,
      });
    } catch (error) {
      console.error("[NotificationService] Failed to queue lead creation notification:", error);
    }
  }
}
