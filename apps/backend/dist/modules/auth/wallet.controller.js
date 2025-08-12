"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const database_js_1 = require("../../config/database.js");
const wallet_service_js_1 = require("./wallet.service.js");
class WalletController {
    constructor() {
        this.walletService = new wallet_service_js_1.WalletService();
    }
    // Get user wallet
    async getUserWallet(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            const walletData = await this.walletService.getUserWallet(userId);
            res.status(200).json({
                success: true,
                data: walletData
            });
        }
        catch (error) {
            console.error('Get wallet error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get wallet'
            });
        }
    }
    // Get wallet balance
    async getWalletBalance(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            const balance = await this.walletService.getWalletBalance(userId);
            res.status(200).json({
                success: true,
                data: { balance, currency: 'G_COIN' }
            });
        }
        catch (error) {
            console.error('Get balance error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get balance'
            });
        }
    }
    // Get transaction history
    async getTransactionHistory(req, res) {
        try {
            const userId = req.user?.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const type = req.query.type;
            const status = req.query.status;
            const sortBy = req.query.sortBy || 'createdAt';
            const sortOrder = req.query.sortOrder || 'desc';
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            const result = await this.walletService.getTransactionHistory(userId, limit, offset, type, status, sortBy, sortOrder);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('Get transaction history error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get transaction history'
            });
        }
    }
    // Transfer funds (admin only for now)
    async transferFunds(req, res) {
        try {
            const adminUserId = req.user?.userId;
            const { fromUserId, toUserId, amount, description } = req.body;
            if (!adminUserId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            // Verify admin role
            const adminUser = await database_js_1.prisma.user.findUnique({
                where: { id: adminUserId }
            });
            if (!adminUser || adminUser.role !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: 'Only admins can perform transfers'
                });
                return;
            }
            if (!fromUserId || !toUserId || !amount || !description) {
                res.status(400).json({
                    success: false,
                    message: 'All fields are required'
                });
                return;
            }
            const result = await this.walletService.transferFunds(fromUserId, toUserId, amount, description);
            res.status(200).json({
                success: true,
                message: 'Transfer completed successfully',
                data: result
            });
        }
        catch (error) {
            console.error('Transfer funds error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to transfer funds'
            });
        }
    }
    // Admin method: Get any user's wallet (admin only)
    async getAnyUserWallet(req, res) {
        try {
            const adminUserId = req.user?.userId;
            const { userId } = req.params;
            if (!adminUserId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            // Verify admin role
            const adminUser = await database_js_1.prisma.user.findUnique({
                where: { id: adminUserId }
            });
            if (!adminUser || adminUser.role !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: 'Only admins can view other users wallets'
                });
                return;
            }
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
                return;
            }
            const walletData = await this.walletService.getAnyUserWallet(userId);
            res.status(200).json({
                success: true,
                data: walletData
            });
        }
        catch (error) {
            console.error('Get any user wallet error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get user wallet'
            });
        }
    }
    // User-to-user transfer
    async transferToUser(req, res) {
        try {
            const fromUserId = req.user?.userId;
            const { toUserId, amount, description, viaWhatsApp, recipientPhone } = req.body;
            if (!fromUserId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            if (!toUserId || !amount || !description) {
                res.status(400).json({
                    success: false,
                    message: 'Recipient, amount, and description are required'
                });
                return;
            }
            if (amount <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'Amount must be greater than 0'
                });
                return;
            }
            const result = await this.walletService.transferToUser(fromUserId, toUserId, amount, description, viaWhatsApp, recipientPhone);
            res.status(200).json({
                success: true,
                message: 'Transfer completed successfully',
                data: result
            });
        }
        catch (error) {
            console.error('Transfer to user error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Transfer failed'
            });
        }
    }
    // Request money from another user
    async requestMoney(req, res) {
        try {
            const requesterId = req.user?.userId;
            const { fromUserId, amount, description, viaWhatsApp, senderPhone } = req.body;
            if (!requesterId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            if (!fromUserId || !amount || !description) {
                res.status(400).json({
                    success: false,
                    message: 'Sender, amount, and description are required'
                });
                return;
            }
            if (amount <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'Amount must be greater than 0'
                });
                return;
            }
            const result = await this.walletService.requestMoney(requesterId, fromUserId, amount, description, viaWhatsApp, senderPhone);
            res.status(200).json({
                success: true,
                message: 'Money request sent successfully',
                data: result
            });
        }
        catch (error) {
            console.error('Request money error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Request failed'
            });
        }
    }
    // Get pending money requests
    async getPendingRequests(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            const requests = await this.walletService.getPendingRequests(userId);
            res.status(200).json({
                success: true,
                data: requests
            });
        }
        catch (error) {
            console.error('Get pending requests error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get pending requests'
            });
        }
    }
    // Approve money request
    async approveMoneyRequest(req, res) {
        try {
            const approverId = req.user?.userId;
            const { requestId } = req.params;
            if (!approverId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            if (!requestId) {
                res.status(400).json({
                    success: false,
                    message: 'Request ID is required'
                });
                return;
            }
            const result = await this.walletService.approveMoneyRequest(requestId, approverId);
            res.status(200).json({
                success: true,
                message: 'Money request approved and transfer completed',
                data: result
            });
        }
        catch (error) {
            console.error('Approve money request error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to approve request'
            });
        }
    }
    // Reject money request
    async rejectMoneyRequest(req, res) {
        try {
            const rejectorId = req.user?.userId;
            const { requestId } = req.params;
            const { reason } = req.body;
            if (!rejectorId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            if (!requestId) {
                res.status(400).json({
                    success: false,
                    message: 'Request ID is required'
                });
                return;
            }
            await this.walletService.rejectMoneyRequest(requestId, rejectorId, reason);
            res.status(200).json({
                success: true,
                message: 'Money request rejected'
            });
        }
        catch (error) {
            console.error('Reject money request error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to reject request'
            });
        }
    }
}
exports.WalletController = WalletController;
