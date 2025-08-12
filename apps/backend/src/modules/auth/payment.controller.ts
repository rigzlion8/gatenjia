import { Request, Response } from 'express';
import { PaymentService, PaymentRequest } from '../../services/payment.service.js';

export class PaymentController {
  private paymentService = new PaymentService();

  /**
   * Process payment and add funds to wallet
   */
  processPayment = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { amount, cardDetails, description } = req.body;

      // Validate amount
      const amountValidation = this.paymentService.validatePaymentAmount(amount);
      if (!amountValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid amount',
          error: amountValidation.error
        });
      }

      // Validate required fields
      if (!cardDetails) {
        return res.status(400).json({
          success: false,
          message: 'Card details are required'
        });
      }

      // Create payment request
      const paymentRequest: PaymentRequest = {
        userId,
        amount,
        cardDetails,
        description
      };

      // Process payment
      const result = await this.paymentService.processPaymentAndAddFunds(paymentRequest);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            transactionId: result.transactionId,
            amount,
            message: result.message
          },
          message: 'Payment processed successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error in processPayment:', error);
      res.status(500).json({
        success: false,
        message: 'Payment processing failed',
        error: 'Internal server error'
      });
    }
  };

  /**
   * Get payment history for user
   */
  getPaymentHistory = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { limit, offset } = req.query;

      const transactions = await this.paymentService.getPaymentHistory(
        userId,
        limit ? parseInt(limit as string) : 10,
        offset ? parseInt(offset as string) : 0
      );

      res.json({
        success: true,
        data: transactions,
        message: 'Payment history retrieved successfully'
      });

    } catch (error) {
      console.error('Error in getPaymentHistory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment history',
        error: 'Internal server error'
      });
    }
  };

  /**
   * Validate payment amount
   */
  validateAmount = async (req: Request, res: Response) => {
    try {
      const { amount } = req.body;

      const validation = this.paymentService.validatePaymentAmount(amount);

      res.json({
        success: validation.isValid,
        data: { isValid: validation.isValid },
        message: validation.isValid ? 'Amount is valid' : validation.error
      });

    } catch (error) {
      console.error('Error in validateAmount:', error);
      res.status(500).json({
        success: false,
        message: 'Validation failed',
        error: 'Internal server error'
      });
    }
  };
}
