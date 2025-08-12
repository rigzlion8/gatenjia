'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '../../lib/api';

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

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'EMAIL' | 'TRANSACTION' | 'ACCOUNT'>('ALL');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchNotifications();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Try to fetch real notifications from the API
      try {
        const response = await apiClient.get<{success: boolean, data: Notification[]}>('/api/notifications');
        if (response.data.success) {
          setNotifications(response.data.data);
          return;
        }
      } catch (apiError) {
        console.log('API not ready yet, using mock data:', apiError);
      }
      
      // Fallback to mock notifications if API is not ready
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'EMAIL',
          title: 'Welcome to Gatenjia!',
          message: 'Your account has been successfully created. Welcome to the platform! We\'re excited to have you on board.',
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
          message: 'You received 25 G Coins from Test User. The funds have been added to your wallet balance.',
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
          message: 'Your transfer of 25 G Coins has been completed successfully. The recipient has been notified.',
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
          message: 'Your profile information has been successfully updated. Changes include updated contact details.',
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        },
        {
          id: '5',
          type: 'EMAIL',
          title: 'Password Changed',
          message: 'Your password has been successfully changed. If you didn\'t make this change, please contact support immediately.',
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
        },
        {
          id: '6',
          type: 'SYSTEM',
          title: 'Maintenance Notice',
          message: 'Scheduled maintenance will occur on Sunday at 2:00 AM UTC. Service may be temporarily unavailable.',
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        },
        {
          id: '7',
          type: 'TRANSACTION',
          title: 'Money Request Approved',
          message: 'Your money request for 50 G Coins has been approved by John Doe. Funds have been transferred to your wallet.',
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          metadata: {
            transactionId: 'tx-456',
            amount: 50,
            senderName: 'John Doe'
          }
        }
      ];
      
      setNotifications(mockNotifications);
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
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return (
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'TRANSACTION':
        return (
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'ACCOUNT':
        return (
          <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'ALL') return true;
    if (filter === 'UNREAD') return !notification.isRead;
    return notification.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600">Stay updated with your account activity</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Mark all as read
                </button>
              )}
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'ALL', label: 'All', count: notifications.length },
              { key: 'UNREAD', label: 'Unread', count: unreadCount },
              { key: 'EMAIL', label: 'Emails', count: notifications.filter(n => n.type === 'EMAIL').length },
              { key: 'TRANSACTION', label: 'Transactions', count: notifications.filter(n => n.type === 'TRANSACTION').length },
              { key: 'ACCOUNT', label: 'Account', count: notifications.filter(n => n.type === 'ACCOUNT').length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.172 13H4m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.172 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'ALL' 
                ? 'You have no notifications yet.' 
                : `No ${filter.toLowerCase()} notifications found.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer ${
                  !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h3 className={`text-lg font-semibold ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            New
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3 leading-relaxed">
                      {notification.message}
                    </p>
                    
                    {/* Metadata Display */}
                    {notification.metadata && (
                      <div className="flex flex-wrap gap-2">
                        {notification.metadata.amount && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            {notification.metadata.amount} G Coins
                          </span>
                        )}
                        {notification.metadata.senderName && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            From: {notification.metadata.senderName}
                          </span>
                        )}
                        {notification.metadata.recipientName && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            To: {notification.metadata.recipientName}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
