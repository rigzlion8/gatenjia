"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class NotificationService {
    /**
     * Create a new notification for a user
     */
    async createNotification(data) {
        try {
            const notification = await prisma.notification.create({
                data: {
                    userId: data.userId,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    metadata: data.metadata || {},
                    isRead: false,
                },
            });
            return notification;
        }
        catch (error) {
            console.error('Error creating notification:', error);
            throw new Error('Failed to create notification');
        }
    }
    /**
     * Get all notifications for a user
     */
    async getUserNotifications(userId, limit, offset) {
        try {
            const notifications = await prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit || 50,
                skip: offset || 0,
            });
            return notifications;
        }
        catch (error) {
            console.error('Error fetching user notifications:', error);
            throw new Error('Failed to fetch notifications');
        }
    }
    /**
     * Get unread notifications count for a user
     */
    async getUnreadCount(userId) {
        try {
            const count = await prisma.notification.count({
                where: {
                    userId,
                    isRead: false,
                },
            });
            return count;
        }
        catch (error) {
            console.error('Error fetching unread count:', error);
            throw new Error('Failed to fetch unread count');
        }
    }
    /**
     * Mark a notification as read
     */
    async markAsRead(notificationId, userId) {
        try {
            const notification = await prisma.notification.updateMany({
                where: {
                    id: notificationId,
                    userId, // Ensure user can only mark their own notifications as read
                },
                data: {
                    isRead: true,
                },
            });
            return notification;
        }
        catch (error) {
            console.error('Error marking notification as read:', error);
            throw new Error('Failed to mark notification as read');
        }
    }
    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId) {
        try {
            const result = await prisma.notification.updateMany({
                where: {
                    userId,
                    isRead: false,
                },
                data: {
                    isRead: true,
                },
            });
            return result;
        }
        catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw new Error('Failed to mark all notifications as read');
        }
    }
    /**
     * Delete a notification
     */
    async deleteNotification(notificationId, userId) {
        try {
            const notification = await prisma.notification.deleteMany({
                where: {
                    id: notificationId,
                    userId, // Ensure user can only delete their own notifications
                },
            });
            return notification;
        }
        catch (error) {
            console.error('Error deleting notification:', error);
            throw new Error('Failed to delete notification');
        }
    }
    /**
     * Create welcome notification
     */
    async createWelcomeNotification(userId, firstName) {
        return this.createNotification({
            userId,
            type: 'EMAIL',
            title: 'Welcome to Gatenjia!',
            message: `Welcome ${firstName}! Your account has been successfully created. We're excited to have you on board.`,
            metadata: {
                emailId: `welcome-${userId}`,
            },
        });
    }
    /**
     * Create money sent notification
     */
    async createMoneySentNotification(userId, amount, recipientName, transactionId) {
        return this.createNotification({
            userId,
            type: 'TRANSACTION',
            title: 'Money Sent Successfully',
            message: `You successfully sent ${amount} G Coins to ${recipientName}. The transaction has been completed.`,
            metadata: {
                transactionId,
                amount,
                recipientName,
            },
        });
    }
    /**
     * Create money received notification
     */
    async createMoneyReceivedNotification(userId, amount, senderName, transactionId) {
        return this.createNotification({
            userId,
            type: 'TRANSACTION',
            title: 'Money Received',
            message: `You received ${amount} G Coins from ${senderName}. The funds have been added to your wallet.`,
            metadata: {
                transactionId,
                amount,
                senderName,
            },
        });
    }
    /**
     * Create money request notification
     */
    async createMoneyRequestNotification(userId, amount, requesterName, requestId) {
        return this.createNotification({
            userId,
            type: 'TRANSACTION',
            title: 'Money Request Received',
            message: `${requesterName} has requested ${amount} G Coins from you. Please review and respond to this request.`,
            metadata: {
                transactionId: requestId,
                amount,
                senderName: requesterName,
            },
        });
    }
    /**
     * Create profile update notification
     */
    async createProfileUpdateNotification(userId) {
        return this.createNotification({
            userId,
            type: 'ACCOUNT',
            title: 'Profile Updated',
            message: 'Your profile information has been successfully updated. Changes include updated contact details.',
        });
    }
    /**
     * Create password change notification
     */
    async createPasswordChangeNotification(userId) {
        return this.createNotification({
            userId,
            type: 'ACCOUNT',
            title: 'Password Changed',
            message: 'Your password has been successfully changed. If you didn\'t make this change, please contact support immediately.',
        });
    }
    /**
     * Create system maintenance notification
     */
    async createSystemNotification(userId, title, message) {
        return this.createNotification({
            userId,
            type: 'SYSTEM',
            title,
            message,
        });
    }
    /**
     * Create failed transaction notification
     */
    async createFailedTransactionNotification(userId, amount, reason, transactionId) {
        return this.createNotification({
            userId,
            type: 'TRANSACTION',
            title: 'Transaction Failed',
            message: `Your transaction of ${amount} G Coins has failed. Reason: ${reason}. Please try again or contact support.`,
            metadata: {
                transactionId,
                amount,
                reason,
            },
        });
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
