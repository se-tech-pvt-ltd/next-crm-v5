import type { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService.js';
import { UserResetTokenService } from '../services/UserResetTokenService.js';
import { UserModel } from '../models/User.js';
import type { NotificationStatus } from '../models/Notification.js';

import { db } from '../config/database.js';
import { notifications } from '../shared/schema.js';
import { eq, and, desc } from 'drizzle-orm';

export class NotificationController {
  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body as { email?: string };
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: 'Invalid email' });
      }

      // Try to find a matching user by email
      let user = null;
      try {
        user = await UserModel.findByEmail(email);
      } catch (err) {
        // ignore lookup errors and fallback to generic behavior
        console.warn('[NotificationController] user lookup failed', err);
      }

      if (user && (user as any).id) {
        const userRecord = user as any;
        const userId = String(userRecord.id);
        const resetTokenPayload = await UserResetTokenService.issueTokenForUser(userId);

        // Queue notification linked to the user record with user variables
        await NotificationService.queueNotification({
          entityType: 'user',
          entityId: userId,
          templateId: 'forgot_password',
          channel: 'email',
          variables: {
            email: userRecord.email || email,
            firstName: userRecord.firstName || userRecord.first_name || '',
            lastName: userRecord.lastName || userRecord.last_name || '',
            token: resetTokenPayload.token,
            resetToken: resetTokenPayload.token,
            expiry: resetTokenPayload.record.expiry.toISOString(),
            resetTokenExpiry: resetTokenPayload.record.expiry.toISOString(),
            resetTokenId: resetTokenPayload.record.id,
          },
          recipientAddress: userRecord.email || email,
          status: 'pending',
          scheduledAt: new Date(),
        });
      } else {
        // Intentionally do nothing to avoid creating entries for non-existent emails
      }

      return res.status(201).json({ message: 'Notification queued' });
    } catch (error) {
      console.error('[NotificationController] forgotPassword error:', error);
      return res.status(500).json({ message: 'Failed to queue notification' });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'Notification ID is required' });
      }

      const { status } = req.body as { status?: unknown };
      if (typeof status !== 'string' || !status.trim()) {
        return res.status(400).json({ message: 'Valid status is required' });
      }

      const normalized = status.trim().toLowerCase();
      const validStatuses = new Set<NotificationStatus>(['pending', 'sent', 'failed']);
      if (!validStatuses.has(normalized as NotificationStatus)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }

      const normalizedStatus = normalized as NotificationStatus;
      const updated = await NotificationService.updateStatus(id, normalizedStatus);

      if (!updated) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      return res.json(updated);
    } catch (error) {
      console.error('[NotificationController] updateStatus error:', error);
      return res.status(500).json({ message: 'Failed to update notification status' });
    }
  }

  static async pending(req: Request, res: Response) {
    try {
      const { templates } = await import('../shared/schema.js');
      const rows = await db
        .select({
          content: templates.template,
          subject: templates.subject,
          variables: notifications.variables,
          entity_type: notifications.entityType,
          status: notifications.status,
          linked_user: notifications.recipientAddress,
          redirect_url: templates.redirectUrl,
          id: notifications.id,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .leftJoin(templates, eq(templates.name, notifications.templateId))
        .where(and(eq(notifications.channel, 'notification'), eq(notifications.status, 'pending')))
        .orderBy(desc(notifications.createdAt));

      const processed = (rows || []).map((r: any) => {
        const vars = r.variables || {};
        let subject = r.subject || '';
        let content = r.content || '';
        try {
          Object.keys(vars).forEach((k) => {
            const v = vars[k];
            const safe = v == null ? '' : String(v);
            const re = new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g');
            subject = subject.replace(re, safe);
            content = content.replace(re, safe);
          });
        } catch (e) {
          // ignore replacement errors
        }
        return {
          id: r.id,
          subject,
          content,
          variables: r.variables,
          entity_type: r.entity_type,
          status: r.status,
          linked_user: r.linked_user,
          redirect_url: r.redirect_url,
          createdAt: r.createdAt,
        };
      });

      return res.status(200).json(processed);
    } catch (error) {
      console.error('[NotificationController] pending error:', error);
      return res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  }
}
