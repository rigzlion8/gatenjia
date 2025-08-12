import { prisma } from '../config/database.js';
import { notificationService } from './notification.service.js';
import { emailService } from './email.service.js';
import { TransactionType, TransactionStatus } from '../modules/auth/auth.types.js';

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
    console.log(`[PAYMENT] Starting payment processing for user ${paymentRequest.userId}, amount: ${paymentRequest.amount}`);
    
    try {
      // Validate card details
      console.log(`[PAYMENT] Validating card details for user ${paymentRequest.userId}`);
      const cardValidation = this.validateCardDetails(paymentRequest.cardDetails);
      if (!cardValidation.isValid) {
        console.log(`[PAYMENT] Card validation failed for user ${paymentRequest.userId}: ${cardValidation.error}`);
        return {
          success: false,
          message: 'Invalid card details',
          error: cardValidation.error
        };
      }
      console.log(`[PAYMENT] Card validation passed for user ${paymentRequest.userId}`);

      // Simulate payment processing (in production, this would integrate with Stripe, PayPal, etc.)
      console.log(`[PAYMENT] Processing payment with bank for user ${paymentRequest.userId}`);
      const paymentResult = await this.processPaymentWithBank(paymentRequest);
      
      if (!paymentResult.success) {
        console.log(`[PAYMENT] Bank payment failed for user ${paymentRequest.userId}: ${paymentResult.error}`);
        return {
          success: false,
          message: 'Payment failed',
          error: paymentResult.error
        };
      }
      console.log(`[PAYMENT] Bank payment successful for user ${paymentRequest.userId}, transaction ID: ${paymentResult.transactionId}`);

      // Add funds to user wallet
      console.log(`[PAYMENT] Adding funds to wallet for user ${paymentRequest.userId}, amount: ${paymentRequest.amount}`);
      const walletUpdate = await this.addFundsToWallet(
        paymentRequest.userId,
        paymentRequest.amount,
        paymentRequest.description || 'Bank deposit'
      );

      if (!walletUpdate.success) {
        console.log(`[PAYMENT] Wallet update failed for user ${paymentRequest.userId}: ${walletUpdate.error}`);
        return {
          success: false,
          message: 'Wallet update failed',
          error: walletUpdate.error
        };
      }
      console.log(`[PAYMENT] Wallet update successful for user ${paymentRequest.userId}`);

      // Create transaction record
      console.log(`[PAYMENT] Creating transaction record for user ${paymentRequest.userId}`);
      const transaction = await this.createTransactionRecord(
        paymentRequest.userId,
        paymentRequest.amount,
        paymentRequest.description || 'Bank deposit',
        paymentResult.transactionId || 'unknown'
      );
      console.log(`[PAYMENT] Transaction record created successfully for user ${paymentRequest.userId}, transaction ID: ${transaction.id}`);

      // Send notification to user
      try {
        console.log(`[PAYMENT] Creating notification for user ${paymentRequest.userId}`);
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
        console.log(`[PAYMENT] Notification created successfully for user ${paymentRequest.userId}`);
      } catch (error) {
        console.error(`[PAYMENT] Failed to create notification for user ${paymentRequest.userId}:`, error);
        // Don't fail the payment if notification fails
      }

      // Send email notification to user
      try {
        console.log(`[PAYMENT] Sending email notification for user ${paymentRequest.userId}`);
        
        // Get user details for email
        const user = await prisma.user.findUnique({
          where: { id: paymentRequest.userId },
          select: { firstName: true, lastName: true, email: true }
        });
        
        if (user) {
          await emailService.sendFundsAddedEmail(
            user,
            paymentRequest.amount,
            paymentRequest.description || 'Bank deposit',
            transaction.id
          );
          console.log(`[PAYMENT] Email notification sent successfully for user ${paymentRequest.userId}`);
        } else {
          console.error(`[PAYMENT] User not found for email notification: ${paymentRequest.userId}`);
        }
      } catch (error) {
        console.error(`[PAYMENT] Failed to send email notification for user ${paymentRequest.userId}:`, error);
        // Don't fail the payment if email fails
      }

      console.log(`[PAYMENT] Payment processing completed successfully for user ${paymentRequest.userId}`);
      return {
        success: true,
        transactionId: transaction.id,
        message: `Successfully added ${paymentRequest.amount} G Coins to your wallet`
      };

    } catch (error) {
      console.error(`[PAYMENT] Payment processing error for user ${paymentRequest.userId}:`, error);
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
    console.log(`[BANK] Starting bank payment processing for user ${paymentRequest.userId}, amount: ${paymentRequest.amount}`);
    
    // Simulate API call delay
    console.log(`[BANK] Simulating API call delay for user ${paymentRequest.userId}`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate payment success/failure (90% success rate for demo)
    const isSuccess = Math.random() > 0.1;
    console.log(`[BANK] Payment success simulation for user ${paymentRequest.userId}: ${isSuccess ? 'SUCCESS' : 'FAILURE'}`);

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
      console.log(`[BANK] Payment failed for user ${paymentRequest.userId}: ${randomFailure}`);
      
      return {
        success: false,
        error: randomFailure
      };
    }

    // Generate mock transaction ID
    const transactionId = `bank_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[BANK] Payment successful for user ${paymentRequest.userId}, transaction ID: ${transactionId}`);

    return {
      success: true,
      transactionId
    };
  }

  /**
   * Add funds to user wallet
   */
  private async addFundsToWallet(userId: string, amount: number, description: string): Promise<{ success: boolean; error?: string }> {
    console.log(`[WALLET] Starting wallet update for user ${userId}, amount: ${amount}`);
    
    try {
      // Get user's wallet
      console.log(`[WALLET] Fetching wallet for user ${userId}`);
      const wallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        console.log(`[WALLET] Wallet not found for user ${userId}`);
        return { success: false, error: 'Wallet not found' };
      }
      console.log(`[WALLET] Wallet found for user ${userId}, current balance: ${wallet.balance}`);

      // Update wallet balance
      console.log(`[WALLET] Updating wallet balance for user ${userId}, incrementing by ${amount}`);
      const updatedWallet = await prisma.wallet.update({
        where: { userId },
        data: {
          balance: {
            increment: amount
          }
        }
      });
      console.log(`[WALLET] Wallet balance updated successfully for user ${userId}, new balance: ${updatedWallet.balance}`);

      return { success: true };
    } catch (error) {
      console.error(`[WALLET] Error updating wallet for user ${userId}:`, error);
      return { success: false, error: 'Failed to update wallet' };
    }
  }

  /**
   * Create transaction record
   */
  private async createTransactionRecord(userId: string, amount: number, description: string, reference: string): Promise<any> {
    console.log(`[TRANSACTION] Starting transaction creation for user ${userId}, amount: ${amount}, reference: ${reference}`);
    
    try {
      console.log(`[TRANSACTION] Fetching wallet for user ${userId}`);
      const wallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        console.log(`[TRANSACTION] Wallet not found for user ${userId}`);
        throw new Error('Wallet not found');
      }
      console.log(`[TRANSACTION] Wallet found for user ${userId}, wallet ID: ${wallet.id}`);

      console.log(`[TRANSACTION] Creating transaction record with data:`, {
        walletId: wallet.id,
        type: TransactionType.CREDIT,
        amount,
        description,
        reference,
        status: TransactionStatus.COMPLETED
      });

      const transaction = await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.CREDIT,
          amount,
          description,
          reference,
          status: TransactionStatus.COMPLETED
        }
      });

      console.log(`[TRANSACTION] Transaction record created successfully for user ${userId}, transaction ID: ${transaction.id}`);
      return transaction;
    } catch (error) {
      console.error(`[TRANSACTION] Error creating transaction record for user ${userId}:`, error);
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
