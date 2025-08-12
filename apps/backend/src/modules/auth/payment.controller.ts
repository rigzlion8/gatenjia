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

      console.log(`[CONTROLLER] Payment request received for user ${userId}, amount: ${amount}, description: ${description}`);
      console.log(`[CONTROLLER] Card details received:`, { 
        cardNumber: cardDetails?.cardNumber ? `${cardDetails.cardNumber.substring(0, 4)}****` : 'undefined',
        expiryMonth: cardDetails?.expiryMonth,
        expiryYear: cardDetails?.expiryYear,
        cvv: cardDetails?.cvv ? '***' : 'undefined',
        cardholderName: cardDetails?.cardholderName
      });

      // Validate amount
      const amountValidation = this.paymentService.validatePaymentAmount(amount);
      if (!amountValidation.isValid) {
        console.log(`[CONTROLLER] Amount validation failed for user ${userId}: ${amountValidation.error}`);
        return res.status(400).json({
          success: false,
          message: 'Invalid amount',
          error: amountValidation.error
        });
      }
      console.log(`[CONTROLLER] Amount validation passed for user ${userId}`);

      // Validate required fields
      if (!cardDetails) {
        console.log(`[CONTROLLER] Card details validation failed for user ${userId}: missing card details`);
        return res.status(400).json({
          success: false,
          message: 'Card details are required'
        });
      }
      console.log(`[CONTROLLER] Card details validation passed for user ${userId}`);

      // Create payment request
      const paymentRequest: PaymentRequest = {
        userId,
        amount,
        cardDetails,
        description
      };

      console.log(`[CONTROLLER] Processing payment for user ${userId}`);
      // Process payment
      const result = await this.paymentService.processPaymentAndAddFunds(paymentRequest);

      if (result.success) {
        console.log(`[CONTROLLER] Payment successful for user ${userId}, transaction ID: ${result.transactionId}`);
        const responseData = {
          success: true,
          data: {
            transactionId: result.transactionId,
            amount,
            message: result.message
          },
          message: 'Payment processed successfully'
        };
        console.log(`[CONTROLLER] Sending success response:`, JSON.stringify(responseData, null, 2));
        res.status(200).json(responseData);
      } else {
        console.log(`[CONTROLLER] Payment failed for user ${userId}: ${result.message} - ${result.error}`);
        const responseData = {
          success: false,
          message: result.message,
          error: result.error
        };
        console.log(`[CONTROLLER] Sending failure response:`, JSON.stringify(responseData, null, 2));
        res.status(400).json(responseData);
      }

    } catch (error) {
      console.error(`[CONTROLLER] Error in processPayment for user ${(req as any).user?.userId}:`, error);
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
