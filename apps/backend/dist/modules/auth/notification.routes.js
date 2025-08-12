"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_js_1 = require("./notification.controller.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
const notificationController = new notification_controller_js_1.NotificationController();
// All notification routes require authentication
router.use(auth_middleware_js_1.authenticateToken);
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
exports.default = router;
