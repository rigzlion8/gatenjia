import { prisma } from '../config/database.js';
import { notificationService } from './notification.service.js';

export interface PaymentCardDetails {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  billingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface PaymentRequest {
  userId: string;
  amount: number;
  cardDetails: PaymentCardDetails;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  error?: string;
}

export class PaymentService {
  /**
   * Process payment and add funds to user wallet
   */
  async processPaymentAndAddFunds(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validate card details
      const cardValidation = this.validateCardDetails(paymentRequest.cardDetails);
      if (!cardValidation.isValid) {
        return {
          success: false,
          message: 'Invalid card details',
          error: cardValidation.error
        };
      }

      // Simulate payment processing (in production, this would integrate with Stripe, PayPal, etc.)
      const paymentResult = await this.processPaymentWithBank(paymentRequest);
      
      if (!paymentResult.success) {
        return {
          success: false,
          message: 'Payment failed',
          error: paymentResult.error
        };
      }

      // Add funds to user wallet
      const walletUpdate = await this.addFundsToWallet(
        paymentRequest.userId,
        paymentRequest.amount,
        paymentRequest.description || 'Bank deposit'
      );

      if (!walletUpdate.success) {
        return {
          success: false,
          message: 'Wallet update failed',
          error: walletUpdate.error
        };
      }

      // Create transaction record
      const transaction = await this.createTransactionRecord(
        paymentRequest.userId,
        paymentRequest.amount,
        paymentRequest.description || 'Bank deposit',
        paymentResult.transactionId || 'unknown'
      );

      // Send notification to user
      try {
        await notificationService.createNotification({
          userId: paymentRequest.userId,
          type: 'TRANSACTION',
          title: 'Funds Added Successfully',
          message: `Your wallet has been credited with ${paymentRequest.amount} G Coins from your bank account.`,
          metadata: {
            transactionId: transaction.id,
            amount: paymentRequest.amount,
            type: 'BANK_DEPOSIT'
          }
        });
      } catch (error) {
        console.error('Failed to create notification:', error);
        // Don't fail the payment if notification fails
      }

      return {
        success: true,
        transactionId: transaction.id,
        message: `Successfully added ${paymentRequest.amount} G Coins to your wallet`
      };

    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        message: 'Payment processing failed',
        error: 'Internal server error'
      };
    }
  }

  /**
   * Validate card details
   */
  private validateCardDetails(cardDetails: PaymentCardDetails): { isValid: boolean; error?: string } {
    // Basic validation - in production, use a proper card validation library
    
    // Check card number length (most cards are 13-19 digits)
    if (!cardDetails.cardNumber || cardDetails.cardNumber.length < 13 || cardDetails.cardNumber.length > 19) {
      return { isValid: false, error: 'Invalid card number' };
    }

    // Check expiry date
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const expiryYear = parseInt(cardDetails.expiryYear);
    const expiryMonth = parseInt(cardDetails.expiryMonth);

    if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
      return { isValid: false, error: 'Card has expired' };
    }

    // Check CVV length
    if (!cardDetails.cvv || cardDetails.cvv.length < 3 || cardDetails.cvv.length > 4) {
      return { isValid: false, error: 'Invalid CVV' };
    }

    // Check cardholder name
    if (!cardDetails.cardholderName || cardDetails.cardholderName.trim().length < 2) {
      return { isValid: false, error: 'Invalid cardholder name' };
    }

    // Check billing address
    if (!cardDetails.billingAddress.line1 || !cardDetails.billingAddress.city || 
        !cardDetails.billingAddress.state || !cardDetails.billingAddress.postalCode || 
        !cardDetails.billingAddress.country) {
      return { isValid: false, error: 'Incomplete billing address' };
    }

    return { isValid: true };
  }

  /**
   * Simulate payment processing with bank
   */
  private async processPaymentWithBank(paymentRequest: PaymentRequest): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate payment success/failure (90% success rate for demo)
    const isSuccess = Math.random() > 0.1;

    if (!isSuccess) {
      // Simulate common payment failures
      const failureReasons = [
        'Insufficient funds',
        'Card declined',
        'Invalid card details',
        'Transaction limit exceeded',
        'Card blocked'
      ];
      const randomFailure = failureReasons[Math.floor(Math.random() * failureReasons.length)];
      
      return {
        success: false,
        error: randomFailure
      };
    }

    // Generate mock transaction ID
    const transactionId = `bank_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      transactionId
    };
  }

  /**
   * Add funds to user wallet
   */
  private async addFundsToWallet(userId: string, amount: number, description: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get user's wallet
      const wallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      // Update wallet balance
      await prisma.wallet.update({
        where: { userId },
        data: {
          balance: {
            increment: amount
          }
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating wallet:', error);
      return { success: false, error: 'Failed to update wallet' };
    }
  }

  /**
   * Create transaction record
   */
  private async createTransactionRecord(userId: string, amount: number, description: string, reference: string): Promise<any> {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const transaction = await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'CREDIT',
          amount,
          description,
          reference,
          status: 'COMPLETED'
        }
      });

      return transaction;
    } catch (error) {
      console.error('Error creating transaction record:', error);
      throw error;
    }
  }

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(userId: string, limit: number = 10, offset: number = 0) {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const transactions = await prisma.transaction.findMany({
        where: {
          walletId: wallet.id,
          type: 'CREDIT',
          description: {
            contains: 'Bank deposit'
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      return transactions;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  /**
   * Validate payment amount
   */
  validatePaymentAmount(amount: number): { isValid: boolean; error?: string } {
    if (amount <= 0) {
      return { isValid: false, error: 'Amount must be greater than 0' };
    }

    if (amount > 10000) {
      return { isValid: false, error: 'Maximum payment amount is 10,000 G Coins' };
    }

    if (amount < 1) {
      return { isValid: false, error: 'Minimum payment amount is 1 G Coin' };
    }

    return { isValid: true };
  }
}

export const paymentService = new PaymentService();
