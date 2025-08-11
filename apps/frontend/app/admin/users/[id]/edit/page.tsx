'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

interface EditFormData {
  role: string;
  status: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserEditPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<EditFormData>({
    role: '',
    status: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setAdminUser(parsedUser);
      
      if (parsedUser.role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }

      fetchUserDetails(token, userId);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router, userId]);

  const fetchUserDetails = async (token: string, targetUserId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/auth/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.data.find((u: User) => u.id === targetUserId);
        if (user) {
          setTargetUser(user);
          setFormData(prev => ({
            ...prev,
            role: user.role,
            status: user.status
          }));
        } else {
          setError('User not found');
        }
      } else {
        setError('Failed to fetch user details');
      }
    } catch (error) {
      setError('Error fetching user details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const validateForm = () => {
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.newPassword && formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Update role if changed
      if (formData.role !== targetUser?.role) {
        const roleResponse = await fetch('http://localhost:4000/api/auth/admin/update-user-role', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: targetUser?.id,
            newRole: formData.role
          })
        });

        if (!roleResponse.ok) {
          const errorData = await roleResponse.json();
          throw new Error(errorData.message || 'Failed to update user role');
        }
      }

      // Update status if changed
      if (formData.status !== targetUser?.status) {
        const statusResponse = await fetch('http://localhost:4000/api/auth/admin/update-user-status', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: targetUser?.id,
            newStatus: formData.status
          })
        });

        if (!statusResponse.ok) {
          const errorData = await statusResponse.json();
          throw new Error(errorData.message || 'Failed to update user status');
        }
      }

      // Update password if provided
      if (formData.newPassword) {
        const passwordResponse = await fetch('http://localhost:4000/api/auth/admin/update-user-password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: targetUser?.id,
            newPassword: formData.newPassword
          })
        });

        if (!passwordResponse.ok) {
          const errorData = await passwordResponse.json();
          throw new Error(errorData.message || 'Failed to update user password');
        }
      }

      setSuccess('User updated successfully!');
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        newPassword: '',
        confirmPassword: ''
      }));

      // Refresh user data
      fetchUserDetails(token, userId);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!adminUser || adminUser.role !== 'ADMIN') {
    return null;
  }

  if (error && !targetUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/admin"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!targetUser) {
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
                href={`/admin/users/${targetUser.id}`}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to User Details
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
                <p className="text-gray-600">{targetUser.firstName} {targetUser.lastName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Admin Dashboard
              </Link>
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
        {/* Current User Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current User Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p><span className="font-medium">Name:</span> {targetUser.firstName} {targetUser.lastName}</p>
              <p><span className="font-medium">Email:</span> {targetUser.email}</p>
              <p><span className="font-medium">Current Role:</span> {getRoleDisplayName(targetUser.role)}</p>
            </div>
            <div>
              <p><span className="font-medium">Current Status:</span> {getStatusDisplayName(targetUser.status)}</p>
              <p><span className="font-medium">Email Verified:</span> {targetUser.emailVerified ? 'Yes' : 'No'}</p>
              <p><span className="font-medium">Member since:</span> {new Date(targetUser.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Update User</h2>
          
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-6 rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Update */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                User Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
                <option value="CHECKER">Checker</option>
                <option value="AUDITOR">Auditor</option>
                <option value="COMPLIANCE">Compliance</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Changing a user's role will affect their access permissions
              </p>
            </div>

            {/* Status Update */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                User Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="PENDING_VERIFICATION">Pending Verification</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Suspended users cannot log in, inactive users have limited access
              </p>
            </div>

            {/* Password Update */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Leave blank to keep current password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Password must be at least 6 characters long. Leave blank to keep current password.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Link
                href={`/admin/users/${targetUser.id}`}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
