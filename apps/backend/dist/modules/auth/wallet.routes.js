"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wallet_controller_js_1 = require("./wallet.controller.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
const walletController = new wallet_controller_js_1.WalletController();
// Wallet routes (authentication required)
router.get('/balance', auth_middleware_js_1.authenticateToken, walletController.getWalletBalance.bind(walletController));
router.get('/wallet', auth_middleware_js_1.authenticateToken, walletController.getUserWallet.bind(walletController));
router.get('/transactions', auth_middleware_js_1.authenticateToken, walletController.getTransactionHistory.bind(walletController));
// User-to-user transfer routes
router.post('/transfer', auth_middleware_js_1.authenticateToken, walletController.transferToUser.bind(walletController));
router.post('/request-money', auth_middleware_js_1.authenticateToken, walletController.requestMoney.bind(walletController));
router.get('/pending-requests', auth_middleware_js_1.authenticateToken, walletController.getPendingRequests.bind(walletController));
router.post('/approve-request/:requestId', auth_middleware_js_1.authenticateToken, walletController.approveMoneyRequest.bind(walletController));
router.post('/reject-request/:requestId', auth_middleware_js_1.authenticateToken, walletController.rejectMoneyRequest.bind(walletController));
// Admin-only routes
router.get('/admin/user/:userId/wallet', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, walletController.getAnyUserWallet.bind(walletController));
router.post('/admin/transfer', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, walletController.transferFunds.bind(walletController));
exports.default = router;
