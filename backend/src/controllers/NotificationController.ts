import type { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService.js';
import { UserResetTokenService } from '../services/UserResetTokenService.js';
import { UserModel } from '../models/User.js';

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
        // No user found: queue a generic notification keyed by email
        await NotificationService.queueNotification({
          entityType: 'auth',
          entityId: String(email),
          templateId: 'forgot_password',
          channel: 'email',
          variables: { email },
          recipientAddress: email,
          status: 'pending',
          scheduledAt: new Date(),
        });
      }

      return res.status(201).json({ message: 'Notification queued' });
    } catch (error) {
      console.error('[NotificationController] forgotPassword error:', error);
      return res.status(500).json({ message: 'Failed to queue notification' });
    }
  }
}
