import { Router } from 'express';
import { WalletController } from './wallet.controller.js';

const router = Router();
const walletController = new WalletController();

// Wallet routes (authentication required)
router.get('/balance', walletController.getWalletBalance.bind(walletController));
router.get('/wallet', walletController.getUserWallet.bind(walletController));
router.get('/transactions', walletController.getTransactionHistory.bind(walletController));

// Admin-only routes
router.post('/transfer', walletController.transferFunds.bind(walletController));

export default router;
