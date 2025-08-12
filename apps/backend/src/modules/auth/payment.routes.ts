import { Router } from 'express';
import { PaymentController } from './payment.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();
const paymentController = new PaymentController();

// All payment routes require authentication
router.use(authenticateToken);

// Process payment and add funds to wallet
router.post('/process', paymentController.processPayment);

// Get payment history for user
router.get('/history', paymentController.getPaymentHistory);

// Validate payment amount
router.post('/validate-amount', paymentController.validateAmount);

export default router;
