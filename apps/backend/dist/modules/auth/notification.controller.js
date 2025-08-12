"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notification_service_1 = require("../../services/notification.service");
class NotificationController {
    constructor() {
        this.notificationService = new notification_service_1.NotificationService();
        /**
         * Get user's notifications
         */
        this.getUserNotifications = async (req, res) => {
            try {
                const userId = req.user.userId;
                const { limit, offset } = req.query;
                const notifications = await this.notificationService.getUserNotifications(userId, limit ? parseInt(limit) : undefined, offset ? parseInt(offset) : undefined);
                res.json({
                    success: true,
                    data: notifications,
                    message: 'Notifications retrieved successfully'
                });
            }
            catch (error) {
                console.error('Error in getUserNotifications:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve notifications'
                });
            }
        };
        /**
         * Get unread notifications count
         */
        this.getUnreadCount = async (req, res) => {
            try {
                const userId = req.user.userId;
                const count = await this.notificationService.getUnreadCount(userId);
                res.json({
                    success: true,
                    data: { count },
                    message: 'Unread count retrieved successfully'
                });
            }
            catch (error) {
                console.error('Error in getUnreadCount:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve unread count'
                });
            }
        };
        /**
         * Mark a notification as read
         */
        this.markAsRead = async (req, res) => {
            try {
                const userId = req.user.userId;
                const { id } = req.params;
                await this.notificationService.markAsRead(id, userId);
                res.json({
                    success: true,
                    message: 'Notification marked as read'
                });
            }
            catch (error) {
                console.error('Error in markAsRead:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to mark notification as read'
                });
            }
        };
        /**
         * Mark all notifications as read
         */
        this.markAllAsRead = async (req, res) => {
            try {
                const userId = req.user.userId;
                await this.notificationService.markAllAsRead(userId);
                res.json({
                    success: true,
                    message: 'All notifications marked as read'
                });
            }
            catch (error) {
                console.error('Error in markAllAsRead:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to mark all notifications as read'
                });
            }
        };
        /**
         * Delete a notification
         */
        this.deleteNotification = async (req, res) => {
            try {
                const userId = req.user.userId;
                const { id } = req.params;
                await this.notificationService.deleteNotification(id, userId);
                res.json({
                    success: true,
                    message: 'Notification deleted successfully'
                });
            }
            catch (error) {
                console.error('Error in deleteNotification:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to delete notification'
                });
            }
        };
    }
}
exports.NotificationController = NotificationController;
