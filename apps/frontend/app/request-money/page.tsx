'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '../../lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

interface RequestData {
  fromUserId: string;
  amount: number;
  description: string;
  viaWhatsApp: boolean;
  senderPhone?: string;
}

export default function RequestMoneyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [requestData, setRequestData] = useState<RequestData>({
    fromUserId: '',
    amount: 0,
    description: '',
    viaWhatsApp: false,
    senderPhone: ''
  });
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router]);

  const searchUsers = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await apiClient.get<User[]>(`/api/auth/search-users?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 3) {
      searchUsers(query);
    } else {
      setSearchResults([]);
    }
  };

  const selectUser = (user: User) => {
    setSelectedUser(user);
    setRequestData(prev => ({
      ...prev,
      fromUserId: user.id,
      senderPhone: user.phoneNumber || ''
    }));
    setSearchQuery(`${user.firstName} ${user.lastName} (${user.email})`);
    setSearchResults([]);
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || requestData.amount <= 0 || !requestData.description) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiClient.post('/api/wallet/request-money', {
        fromUserId: requestData.fromUserId,
        amount: requestData.amount,
        description: requestData.description,
        viaWhatsApp: requestData.viaWhatsApp,
        senderPhone: requestData.senderPhone
      });

      if (response.success) {
        setSuccess('Money request sent successfully!');
        setRequestData({
          fromUserId: '',
          amount: 0,
          description: '',
          viaWhatsApp: false,
          senderPhone: ''
        });
        setSelectedUser(null);
        setSearchQuery('');
        
        // If WhatsApp request, show WhatsApp integration message
        if (requestData.viaWhatsApp) {
          setSuccess(prev => prev + ' WhatsApp notification sent to sender.');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Request failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

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
              <h1 className="text-2xl font-bold text-gray-900">Request Money</h1>
              <p className="text-gray-600">Ask other users to send you money</p>
            </div>
            <div className="flex items-center space-x-4">
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

      {/* Error/Success Messages */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Request Failed</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Request Sent</h3>
                <p className="mt-1 text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Request Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Request Money</h2>
          
          <form onSubmit={handleRequest} className="space-y-6">
            {/* Sender Search */}
            <div>
              <label htmlFor="sender" className="block text-sm font-medium text-gray-700 mb-2">
                From (Who to ask for money)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="sender"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searching && (
                  <div className="absolute right-3 top-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => selectUser(user)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                      {user.phoneNumber && (
                        <div className="text-sm text-gray-500">📱 {user.phoneNumber}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Request
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="amount"
                  min="0.01"
                  step="0.01"
                  value={requestData.amount || ''}
                  onChange={(e) => setRequestData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Request
              </label>
              <textarea
                id="description"
                rows={3}
                value={requestData.description}
                onChange={(e) => setRequestData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Explain why you need this money..."
              />
            </div>

            {/* WhatsApp Integration */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="whatsapp"
                  checked={requestData.viaWhatsApp}
                  onChange={(e) => setRequestData(prev => ({ ...prev, viaWhatsApp: e.target.checked }))}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="whatsapp" className="flex items-center space-x-2">
                  <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  <span className="text-green-800 font-medium">Request via WhatsApp</span>
                </label>
              </div>
              <p className="mt-2 text-sm text-green-700">
                Enable this to send a WhatsApp notification to the sender about your request
              </p>
              
              {requestData.viaWhatsApp && (
                <div className="mt-3">
                  <label htmlFor="senderPhone" className="block text-sm font-medium text-green-800 mb-1">
                    Sender Phone Number (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    id="senderPhone"
                    value={requestData.senderPhone}
                    onChange={(e) => setRequestData(prev => ({ ...prev, senderPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="+1234567890"
                  />
                  <p className="mt-1 text-xs text-green-600">
                    Include country code (e.g., +1 for US, +254 for Kenya)
                  </p>
                </div>
              )}
            </div>

            {/* Request Button */}
            <button
              type="submit"
              disabled={loading || !selectedUser || requestData.amount <= 0 || !requestData.description}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending Request...</span>
                </div>
              ) : (
                `Request ${formatCurrency(requestData.amount)}`
              )}
            </button>
          </form>
        </div>

        {/* Request Tips */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-medium text-green-900 mb-3">💡 Request Tips</h3>
          <ul className="space-y-2 text-sm text-green-800">
            <li>• Be specific about why you need the money</li>
            <li>• Include a clear description to help the sender understand</li>
            <li>• WhatsApp notifications increase the chance of quick responses</li>
            <li>• Requests are not automatic - the sender must approve</li>
            <li>• You'll be notified when the sender responds to your request</li>
          </ul>
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Pending Requests</h3>
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm">No pending requests</p>
            <p className="text-xs">Your money requests will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
