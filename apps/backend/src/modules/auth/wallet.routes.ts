import { Router } from 'express';
import { WalletController } from './wallet.controller.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.middleware.js';

const router = Router();
const walletController = new WalletController();

// Wallet routes (authentication required)
router.get('/balance', authenticateToken, walletController.getWalletBalance.bind(walletController));
router.get('/wallet', authenticateToken, walletController.getUserWallet.bind(walletController));
router.get('/transactions', authenticateToken, walletController.getTransactionHistory.bind(walletController));

// User-to-user transfer routes
router.post('/transfer', authenticateToken, walletController.transferToUser.bind(walletController));
router.post('/request-money', authenticateToken, walletController.requestMoney.bind(walletController));
router.get('/pending-requests', authenticateToken, walletController.getPendingRequests.bind(walletController));
router.post('/approve-request/:requestId', authenticateToken, walletController.approveMoneyRequest.bind(walletController));
router.post('/reject-request/:requestId', authenticateToken, walletController.rejectMoneyRequest.bind(walletController));

// Admin-only routes
router.get('/admin/user/:userId/wallet', authenticateToken, requireAdmin, walletController.getAnyUserWallet.bind(walletController));
router.post('/admin/transfer', authenticateToken, requireAdmin, walletController.transferFunds.bind(walletController));

export default router;
