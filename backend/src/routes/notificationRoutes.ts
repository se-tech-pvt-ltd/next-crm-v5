import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController.js';

export const notificationRoutes = Router();

notificationRoutes.post('/forgot-password', NotificationController.forgotPassword);
notificationRoutes.get('/pending', NotificationController.pending);

export default notificationRoutes;
