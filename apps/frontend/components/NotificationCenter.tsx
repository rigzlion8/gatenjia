'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'EMAIL' | 'ACCOUNT' | 'TRANSACTION' | 'SYSTEM';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    emailId?: string;
    transactionId?: string;
    amount?: number;
    senderName?: string;
    recipientName?: string;
  };
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // For now, we'll create mock notifications since we haven't implemented the backend yet
      // In the future, this will call: const response = await apiClient.get('/api/notifications');
      
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'EMAIL',
          title: 'Welcome to Gatenjia!',
          message: 'Your account has been successfully created. Welcome to the platform!',
          isRead: false,
          createdAt: new Date().toISOString(),
          metadata: {
            emailId: 'welcome-email-1'
          }
        },
        {
          id: '2',
          type: 'TRANSACTION',
          title: 'Money Received',
          message: 'You received 25 G Coins from Test User',
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          metadata: {
            transactionId: 'tx-123',
            amount: 25,
            senderName: 'Test User'
          }
        },
        {
          id: '3',
          type: 'EMAIL',
          title: 'Transfer Confirmation',
          message: 'Your transfer of 25 G Coins has been completed successfully',
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
          metadata: {
            emailId: 'transfer-email-1',
            amount: 25
          }
        },
        {
          id: '4',
          type: 'ACCOUNT',
          title: 'Profile Updated',
          message: 'Your profile information has been successfully updated',
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        }
      ];
      
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Try to use the real API first
      try {
        await apiClient.put(`/api/notifications/${notificationId}/read`);
      } catch (apiError) {
        console.log('API not ready yet, updating locally:', apiError);
      }
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Try to use the real API first
      try {
        await apiClient.put('/api/notifications/mark-all-read');
      } catch (apiError) {
        console.log('API not ready yet, updating locally:', apiError);
      }
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'TRANSACTION':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'ACCOUNT':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.83 2.83A4 4 0 0112 2a4 4 0 014 4c0 1.97-1.09 3.67-2.67 4.46A7.96 7.96 0 0012 16a7.96 7.96 0 00-1.33-.54A4 4 0 018.17 2.83z" />
        </svg>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center">
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.172 13H4m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.172 13H4" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">No notifications yet</p>
                <p className="text-xs text-gray-500">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatNotificationTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        {/* Metadata Display */}
                        {notification.metadata && (
                          <div className="mt-2 text-xs text-gray-500">
                            {notification.metadata.amount && (
                              <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-2">
                                Amount: {notification.metadata.amount} G
                              </span>
                            )}
                            {notification.metadata.senderName && (
                              <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-2">
                                From: {notification.metadata.senderName}
                              </span>
                            )}
                            {notification.metadata.recipientName && (
                              <span className="inline-block bg-gray-100 px-2 py-1 rounded">
                                To: {notification.metadata.recipientName}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Unread Indicator */}
                      {!notification.isRead && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Link
              href="/notifications"
              className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
