import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController.js';

export const notificationRoutes = Router();

notificationRoutes.post('/forgot-password', NotificationController.forgotPassword);

export default notificationRoutes;
