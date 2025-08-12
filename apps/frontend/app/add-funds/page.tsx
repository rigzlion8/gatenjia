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
  role: string;
  status: string;
}

interface CardDetails {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  billingAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export default function AddFundsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    billingAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    }
  });

  // Validation state
  const [amountError, setAmountError] = useState('');
  const [cardErrors, setCardErrors] = useState<{
    cardNumber?: string;
    expiryMonth?: string;
    expiryYear?: string;
    cvv?: string;
    cardholderName?: string;
    line1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>({});

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
    }
  }, [router]);

  const validateAmount = (value: string) => {
    const numValue = parseFloat(value);
    if (!value || isNaN(numValue)) {
      setAmountError('Please enter a valid amount');
      return false;
    }
    if (numValue <= 0) {
      setAmountError('Amount must be greater than 0');
      return false;
    }
    if (numValue > 10000) {
      setAmountError('Maximum amount is 10,000 G Coins');
      return false;
    }
    if (numValue < 1) {
      setAmountError('Minimum amount is 1 G Coin');
      return false;
    }
    setAmountError('');
    return true;
  };

  const validateCardDetails = () => {
    const errors: {
      cardNumber?: string;
      expiryMonth?: string;
      expiryYear?: string;
      cvv?: string;
      cardholderName?: string;
      line1?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    } = {};

    if (!cardDetails.cardNumber || cardDetails.cardNumber.length < 13) {
      errors.cardNumber = 'Please enter a valid card number';
    }

    if (!cardDetails.expiryMonth || !cardDetails.expiryYear) {
      errors.expiryMonth = 'Please enter expiry date';
    }

    if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
      errors.cvv = 'Please enter a valid CVV';
    }

    if (!cardDetails.cardholderName.trim()) {
      errors.cardholderName = 'Please enter cardholder name';
    }

    if (!cardDetails.billingAddress.line1.trim()) {
      errors.line1 = 'Please enter address line 1';
    }

    if (!cardDetails.billingAddress.city.trim()) {
      errors.city = 'Please enter city';
    }

    if (!cardDetails.billingAddress.state.trim()) {
      errors.state = 'Please enter state';
    }

    if (!cardDetails.billingAddress.postalCode.trim()) {
      errors.postalCode = 'Please enter postal code';
    }

    if (!cardDetails.billingAddress.country.trim()) {
      errors.country = 'Please enter country';
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    validateAmount(value);
  };

  const handleCardDetailChange = (field: keyof CardDetails, value: string) => {
    setCardDetails(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (cardErrors[field]) {
      setCardErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleBillingAddressChange = (field: keyof CardDetails['billingAddress'], value: string) => {
    setCardDetails(prev => ({
      ...prev,
      billingAddress: {
        ...prev.billingAddress,
        [field]: value
      }
    }));
    
    // Clear error when user starts typing
    if (cardErrors[field as keyof CardDetails]) {
      setCardErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAmount(amount) || !validateCardDetails()) {
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccess(null);

          try {
        const response = await apiClient.post<{success: boolean, message: string, error?: string}>('/api/payments/process', {
          amount: parseFloat(amount),
          cardDetails,
          description: `Bank deposit - ${amount} G Coins`
        });

        if (response.data.success) {
          setSuccess(response.data.message);
          setAmount('');
          setCardDetails({
            cardNumber: '',
            expiryMonth: '',
            expiryYear: '',
            cvv: '',
            cardholderName: '',
            billingAddress: {
              line1: '',
              line2: '',
              city: '',
              state: '',
              postalCode: '',
              country: ''
            }
          });
          
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
        } else {
          setError(response.data.error || 'Payment failed');
        }
      } catch (error: any) {
        console.error('Payment error:', error);
        setError(error.response?.data?.error || 'Payment processing failed');
      } finally {
      setProcessing(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

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
                <h1 className="text-2xl font-bold text-gray-900">Add Funds</h1>
                <p className="text-gray-600">Add money to your wallet using your bank card</p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
                <p className="text-sm text-green-700">Redirecting to dashboard...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">Payment Failed</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Amount</h3>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (G Coins)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    step="0.01"
                    min="1"
                    max="10000"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      amountError ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={processing}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">G</span>
                  </div>
                </div>
                {amountError && (
                  <p className="mt-1 text-sm text-red-600">{amountError}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Minimum: 1 G Coin | Maximum: 10,000 G Coins
                </p>
              </div>
            </div>

            {/* Card Details Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Card Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card Number */}
                <div className="md:col-span-2">
                  <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    id="cardNumber"
                    value={cardDetails.cardNumber}
                    onChange={(e) => handleCardDetailChange('cardNumber', e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      cardErrors.cardNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={processing}
                  />
                  {cardErrors.cardNumber && (
                    <p className="mt-1 text-sm text-red-600">{cardErrors.cardNumber}</p>
                  )}
                </div>

                {/* Expiry Date */}
                <div>
                  <label htmlFor="expiryMonth" className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Month
                  </label>
                  <select
                    id="expiryMonth"
                    value={cardDetails.expiryMonth}
                    onChange={(e) => handleCardDetailChange('expiryMonth', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      cardErrors.expiryMonth ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={processing}
                  >
                    <option value="">Month</option>
                    {months.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  {cardErrors.expiryMonth && (
                    <p className="mt-1 text-sm text-red-600">{cardErrors.expiryMonth}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="expiryYear" className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Year
                  </label>
                  <select
                    id="expiryYear"
                    value={cardDetails.expiryYear}
                    onChange={(e) => handleCardDetailChange('expiryYear', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      cardErrors.expiryYear ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={processing}
                  >
                    <option value="">Year</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  {cardErrors.expiryYear && (
                    <p className="mt-1 text-sm text-red-600">{cardErrors.expiryYear}</p>
                  )}
                </div>

                {/* CVV */}
                <div>
                  <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    id="cvv"
                    value={cardDetails.cvv}
                    onChange={(e) => handleCardDetailChange('cvv', e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      cardErrors.cvv ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={processing}
                  />
                  {cardErrors.cvv && (
                    <p className="mt-1 text-sm text-red-600">{cardErrors.cvv}</p>
                  )}
                </div>

                {/* Cardholder Name */}
                <div>
                  <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700 mb-2">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    id="cardholderName"
                    value={cardDetails.cardholderName}
                    onChange={(e) => handleCardDetailChange('cardholderName', e.target.value)}
                    placeholder="John Doe"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      cardErrors.cardholderName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={processing}
                  />
                  {cardErrors.cardholderName && (
                    <p className="mt-1 text-sm text-red-600">{cardErrors.cardholderName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Billing Address Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Address Line 1 */}
                <div className="md:col-span-2">
                  <label htmlFor="line1" className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    id="line1"
                    value={cardDetails.billingAddress.line1}
                    onChange={(e) => handleBillingAddressChange('line1', e.target.value)}
                    placeholder="123 Main Street"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      cardErrors.line1 ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={processing}
                  />
                  {cardErrors.line1 && (
                    <p className="mt-1 text-sm text-red-600">{cardErrors.line1}</p>
                  )}
                </div>

                {/* Address Line 2 */}
                <div className="md:col-span-2">
                  <label htmlFor="line2" className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    id="line2"
                    value={cardDetails.billingAddress.line2}
                    onChange={(e) => handleBillingAddressChange('line2', e.target.value)}
                    placeholder="Apt, Suite, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={processing}
                  />
                </div>

                {/* City */}
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={cardDetails.billingAddress.city}
                    onChange={(e) => handleBillingAddressChange('city', e.target.value)}
                    placeholder="New York"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      cardErrors.city ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={processing}
                  />
                  {cardErrors.city && (
                    <p className="mt-1 text-sm text-red-600">{cardErrors.city}</p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province
                  </label>
                  <input
                    type="text"
                    id="state"
                    value={cardDetails.billingAddress.state}
                    onChange={(e) => handleBillingAddressChange('state', e.target.value)}
                    placeholder="NY"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      cardErrors.state ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={processing}
                  />
                  {cardErrors.state && (
                    <p className="mt-1 text-sm text-red-600">{cardErrors.state}</p>
                  )}
                </div>

                {/* Postal Code */}
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    value={cardDetails.billingAddress.postalCode}
                    onChange={(e) => handleBillingAddressChange('postalCode', e.target.value)}
                    placeholder="10001"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      cardErrors.postalCode ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={processing}
                  />
                  {cardErrors.postalCode && (
                    <p className="mt-1 text-sm text-red-600">{cardErrors.postalCode}</p>
                  )}
                </div>

                {/* Country */}
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    value={cardDetails.billingAddress.country}
                    onChange={(e) => handleBillingAddressChange('country', e.target.value)}
                    placeholder="United States"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      cardErrors.country ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={processing}
                  />
                  {cardErrors.country && (
                    <p className="mt-1 text-sm text-red-600">{cardErrors.country}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={processing || !amount || !!amountError}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                  processing || !amount || amountError
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {processing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing Payment...
                  </div>
                ) : (
                  `Add ${amount || '0'} G Coins to Wallet`
                )}
              </button>
            </div>

            {/* Security Notice */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                🔒 Your payment information is secure and encrypted. We use industry-standard security measures to protect your data.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
