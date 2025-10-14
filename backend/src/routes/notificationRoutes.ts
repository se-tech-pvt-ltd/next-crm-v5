import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController.js';
import { requireAuth } from '../middlewares/auth.js';

export const notificationRoutes = Router();

notificationRoutes.post('/forgot-password', NotificationController.forgotPassword);
notificationRoutes.patch('/:id/status', requireAuth, NotificationController.updateStatus);
notificationRoutes.get('/pending', NotificationController.pending);

export default notificationRoutes;
