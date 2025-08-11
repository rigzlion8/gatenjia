import { Router } from 'express';
import { WalletController } from './wallet.controller.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.middleware.js';

const router = Router();
const walletController = new WalletController();

// Wallet routes (authentication required)
router.get('/balance', authenticateToken, walletController.getWalletBalance.bind(walletController));
router.get('/wallet', authenticateToken, walletController.getUserWallet.bind(walletController));
router.get('/transactions', authenticateToken, walletController.getTransactionHistory.bind(walletController));

// Admin-only routes
router.get('/admin/user/:userId/wallet', authenticateToken, requireAdmin, walletController.getAnyUserWallet.bind(walletController));
router.post('/transfer', authenticateToken, requireAdmin, walletController.transferFunds.bind(walletController));

export default router;
