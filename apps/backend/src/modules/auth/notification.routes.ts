import { Router } from 'express';
import { NotificationController } from './notification.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();
const notificationController = new NotificationController();

// All notification routes require authentication
router.use(authenticateToken);

// Get user's notifications
router.get('/', notificationController.getUserNotifications);

// Get unread notifications count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark a notification as read
router.put('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', notificationController.markAllAsRead);

// Delete a notification
router.delete('/:id', notificationController.deleteNotification);

export default router;
