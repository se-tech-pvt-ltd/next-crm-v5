import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService.js';

export class NotificationController {
  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body as { email?: string };
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: 'Invalid email' });
      }

      await NotificationService.queueNotification({
        entityType: 'auth',
        entityId: String(email),
        templateId: 'forgot_password',
        channel: 'email',
        variables: { email },
        recipientAddress: email,
      });

      return res.status(201).json({ message: 'Notification queued' });
    } catch (error) {
      console.error('[NotificationController] forgotPassword error:', error);
      return res.status(500).json({ message: 'Failed to queue notification' });
    }
  }
}
