'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN' | 'CHECKER' | 'AUDITOR' | 'COMPLIANCE';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');

    if (!userData || !token) {
      router.push('/auth/login');
      return;
    }

    try {
      const userObj = JSON.parse(userData);
      setUser(userObj);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Gatenjia Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {user.firstName} {user.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* User Info Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">User Role</dt>
                      <dd className="text-lg font-medium text-gray-900 capitalize">{user.role}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Status Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      user.status.toLowerCase() === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}>
                      <span className="text-white font-semibold text-lg">
                        {user.status.toLowerCase() === 'active' ? '✓' : '!'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Account Status</dt>
                      <dd className="text-lg font-medium text-gray-900 capitalize">{user.status.toLowerCase()}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">@</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Email</dt>
                      <dd className="text-lg font-medium text-gray-900">{user.email}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome to Gatenjia!</h2>
            <p className="text-gray-600">
              You are now logged in as a <span className="font-semibold capitalize">{user.role.toLowerCase()}</span> user. 
              Based on your role, you have access to different features and permissions within the system.
            </p>
            
            {user.role === 'ADMIN' && (
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <p className="text-blue-800">
                  <strong>Admin Access:</strong> You can manage users, view all transactions, and access system settings.
                </p>
              </div>
            )}
            
            {user.role === 'CHECKER' && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-md">
                <p className="text-yellow-800">
                  <strong>Checker Access:</strong> You can review and approve second-level transactions.
                </p>
              </div>
            )}
            
            {user.role === 'AUDITOR' && (
              <div className="mt-4 p-4 bg-purple-50 rounded-md">
                <p className="text-purple-800">
                  <strong>Auditor Access:</strong> You can view audit logs and perform compliance reviews.
                </p>
              </div>
            )}
            
            {user.role === 'COMPLIANCE' && (
              <div className="mt-4 p-4 bg-green-50 rounded-md">
                <p className="text-green-800">
                  <strong>Compliance Access:</strong> You can monitor regulatory compliance and manage risk assessments.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
