'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  id: string;
  walletId: string;
  type: 'CREDIT' | 'DEBIT' | 'TRANSFER' | 'WITHDRAWAL' | 'DEPOSIT';
  amount: number;
  description: string;
  reference?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

interface WalletData {
  wallet: Wallet;
  recentTransactions: Transaction[];
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      fetchWalletData(token);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router]);

  const fetchWalletData = async (token: string) => {
    try {
      const response = await fetch('http://localhost:4000/api/wallet/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWalletData(data.data);
      } else {
        console.error('Failed to fetch wallet data');
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
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

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'CREDIT':
        return 'text-green-600';
      case 'DEBIT':
        return 'text-red-600';
      case 'TRANSFER':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
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
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.firstName}!</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">User Information</h2>
              <div className="mt-4 space-y-2">
                <p><span className="font-medium">Name:</span> {user.firstName} {user.lastName}</p>
                <p><span className="font-medium">Email:</span> {user.email}</p>
                <p><span className="font-medium">Role:</span> {getRoleDisplayName(user.role)}</p>
                <p><span className="font-medium">Status:</span> {getStatusDisplayName(user.status)}</p>
                <p><span className="font-medium">Member since:</span> {formatDate(user.createdAt)}</p>
              </div>
            </div>
            <div className="text-right">
              {user.status === 'PENDING_VERIFICATION' && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg">
                  <p className="font-medium">Account Verification Required</p>
                  <p className="text-sm">Please contact support to verify your account</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wallet Card */}
        {walletData && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Wallet</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Balance</h3>
                <p className="text-3xl font-bold">{walletData.wallet.balance} G Coins</p>
                <p className="text-blue-100">≈ ${walletData.wallet.balance} USD</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Currency</h3>
                <p className="text-2xl font-bold">{walletData.wallet.currency}</p>
                <p className="text-green-100">1 G Coin = $1 USD</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Created</h3>
                <p className="text-2xl font-bold">{formatDate(walletData.wallet.createdAt)}</p>
                <p className="text-purple-100">Wallet activated</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {walletData && walletData.recentTransactions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {walletData.recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-medium ${getTransactionTypeColor(transaction.type)}`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-bold ${transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'CREDIT' ? '+' : '-'}{transaction.amount} G
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Role-specific welcome message */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome Message</h2>
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
