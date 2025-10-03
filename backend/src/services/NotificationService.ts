import { NotificationModel } from "../models/Notification.js";
import { type Lead } from "../shared/schema.js";

const LEAD_CREATION_TEMPLATE_ID = "nxtcrm_lead_creation";

export class NotificationService {
  static async queueLeadCreationNotification(lead: Lead): Promise<void> {
    try {
      if (!lead?.id) {
        return;
      }

      const now = new Date();

      await NotificationModel.create({
        entityType: "lead",
        entityId: lead.id,
        templateId: LEAD_CREATION_TEMPLATE_ID,
        channel: "whatsapp",
        status: "pending",
        variables: {
          lead_name: lead.name ?? "",
        },
        recipientAddress: lead.phone ?? null,
        scheduledAt: now,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      console.error("[NotificationService] Failed to queue lead creation notification:", error);
    }
  }
}
