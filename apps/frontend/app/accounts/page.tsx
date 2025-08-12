'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN' | 'CHECKER' | 'AUDITOR' | 'COMPLIANCE';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export default function AccountsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  const getRoleDisplayName = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  const getStatusDisplayName = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading account information...</p>
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
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Account Information</h1>
                <p className="text-gray-600">Manage your account settings and view details</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Admin Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            <div className="text-right">
              {user.status === 'PENDING_VERIFICATION' && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg">
                  <p className="font-medium">Account Verification Required</p>
                  <p className="text-sm">Please contact support to verify your account</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p><span className="font-medium">Name:</span> {user.firstName} {user.lastName}</p>
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Role:</span> {getRoleDisplayName(user.role)}</p>
            </div>
            <div>
              <p><span className="font-medium">Status:</span> {getStatusDisplayName(user.status)}</p>
              <p><span className="font-medium">Email Verified:</span> {user.emailVerified ? 'Yes' : 'No'}</p>
              <p><span className="font-medium">Member since:</span> {formatDate(user.createdAt)}</p>
              {user.lastLoginAt && (
                <p><span className="font-medium">Last login:</span> {formatDate(user.lastLoginAt)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Role-specific Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Access</h2>
          
          {user.role === 'ADMIN' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                <strong>Admin Access:</strong> You have full access to manage users, roles, and system settings. 
                You can also perform wallet transfers and view all user data.
              </p>
            </div>
          )}
          
          {user.role === 'USER' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                <strong>User Access:</strong> Welcome to Gatenjia! You have access to your wallet and can view 
                your transaction history. Your account is currently under verification.
              </p>
            </div>
          )}
          
          {user.role === 'CHECKER' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-purple-800">
                <strong>Checker Access:</strong> You have access to review and approve second-level transactions. 
                Monitor the system for any suspicious activities.
              </p>
            </div>
          )}
          
          {user.role === 'AUDITOR' && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-indigo-800">
                <strong>Auditor Access:</strong> You have access to audit logs and can review system activities 
                for compliance and security purposes.
              </p>
            </div>
          )}
          
          {user.role === 'COMPLIANCE' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-orange-800">
                <strong>Compliance Access:</strong> You have access to compliance reports and can ensure 
                the system adheres to regulatory requirements.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
