import { Request, Response } from 'express';
import { NotificationService } from '../../services/notification.service';

export class NotificationController {
  private notificationService = new NotificationService();

  /**
   * Get user's notifications
   */
  getUserNotifications = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { limit, offset } = req.query;

      const notifications = await this.notificationService.getUserNotifications(
        userId,
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );

      res.json({
        success: true,
        data: notifications,
        message: 'Notifications retrieved successfully'
      });
    } catch (error) {
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
  getUnreadCount = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;

      const count = await this.notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { count },
        message: 'Unread count retrieved successfully'
      });
    } catch (error) {
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
  markAsRead = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;

      await this.notificationService.markAsRead(id, userId);

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
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
  markAllAsRead = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;

      await this.notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
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
  deleteNotification = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;

      await this.notificationService.deleteNotification(id, userId);

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification'
      });
    }
  };
}
