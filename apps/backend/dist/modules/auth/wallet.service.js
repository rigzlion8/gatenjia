"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const database_1 = require("../../config/database");
const whatsapp_service_1 = require("../../services/whatsapp.service");
const email_service_1 = require("../../services/email.service");
const notification_service_1 = require("../../services/notification.service");
const type_converters_1 = require("./type-converters");
const auth_constants_1 = require("./auth.constants");
class WalletService {
    // Create wallet for new user
    async createWallet(userId) {
        const wallet = await database_1.prisma.wallet.create({
            data: {
                userId,
                balance: 100, // 100 G coins = $100 USD
                currency: 'G_COIN'
            }
        });
        // Create initial transaction record
        await database_1.prisma.transaction.create({
            data: {
                walletId: wallet.id,
                type: auth_constants_1.TRANSACTION_TYPES.CREDIT,
                amount: 100,
                description: 'Initial wallet balance - Welcome bonus',
                status: auth_constants_1.TRANSACTION_STATUSES.COMPLETED
            }
        });
        return (0, type_converters_1.prismaWalletToIWallet)(wallet);
    }
    // Get user wallet with recent transactions
    async getUserWallet(userId) {
        const wallet = await database_1.prisma.wallet.findUnique({
            where: { userId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 5 // Show only 5 most recent transactions on dashboard
                    // Users can view all transactions on the dedicated transactions page
                }
            }
        });
        if (!wallet) {
            throw new Error('Wallet not found');
        }
        return {
            wallet: (0, type_converters_1.prismaWalletToIWallet)(wallet),
            recentTransactions: wallet.transactions.map(type_converters_1.prismaTransactionToITransaction)
        };
    }
    // Get wallet balance
    async getWalletBalance(userId) {
        const wallet = await database_1.prisma.wallet.findUnique({
            where: { userId },
            select: { balance: true }
        });
        if (!wallet) {
            throw new Error('Wallet not found');
        }
        return Number(wallet.balance);
    }
    // Add funds to wallet
    async addFunds(userId, amount, description) {
        const wallet = await database_1.prisma.wallet.findUnique({
            where: { userId }
        });
        if (!wallet) {
            throw new Error('Wallet not found');
        }
        // Update balance
        const updatedWallet = await database_1.prisma.wallet.update({
            where: { userId },
            data: {
                balance: {
                    increment: amount
                }
            }
        });
        // Create transaction record
        await database_1.prisma.transaction.create({
            data: {
                walletId: wallet.id,
                type: auth_constants_1.TRANSACTION_TYPES.CREDIT,
                amount,
                description,
                status: auth_constants_1.TRANSACTION_STATUSES.COMPLETED
            }
        });
        return (0, type_converters_1.prismaWalletToIWallet)(updatedWallet);
    }
    // Deduct funds from wallet
    async deductFunds(userId, amount, description) {
        const wallet = await database_1.prisma.wallet.findUnique({
            where: { userId }
        });
        if (!wallet) {
            throw new Error('Wallet not found');
        }
        if (Number(wallet.balance) < amount) {
            throw new Error('Insufficient funds');
        }
        // Update balance
        const updatedWallet = await database_1.prisma.wallet.update({
            where: { userId },
            data: {
                balance: {
                    decrement: amount
                }
            }
        });
        // Create transaction record
        await database_1.prisma.transaction.create({
            data: {
                walletId: wallet.id,
                type: auth_constants_1.TRANSACTION_TYPES.DEBIT,
                amount,
                description,
                status: auth_constants_1.TRANSACTION_STATUSES.COMPLETED
            }
        });
        return (0, type_converters_1.prismaWalletToIWallet)(updatedWallet);
    }
    // Transfer funds between wallets
    async transferFunds(fromUserId, toUserId, amount, description) {
        // Use transaction to ensure data consistency
        const result = await database_1.prisma.$transaction(async (tx) => {
            const fromWallet = await tx.wallet.findUnique({
                where: { userId: fromUserId }
            });
            const toWallet = await tx.wallet.findUnique({
                where: { userId: toUserId }
            });
            if (!fromWallet || !toWallet) {
                throw new Error('One or both wallets not found');
            }
            if (Number(fromWallet.balance) < amount) {
                throw new Error('Insufficient funds for transfer');
            }
            // Update both wallets
            const updatedFromWallet = await tx.wallet.update({
                where: { userId: fromUserId },
                data: { balance: { decrement: amount } }
            });
            const updatedToWallet = await tx.wallet.update({
                where: { userId: toUserId },
                data: { balance: { increment: amount } }
            });
            // Create transaction records
            await tx.transaction.create({
                data: {
                    walletId: fromWallet.id,
                    type: auth_constants_1.TRANSACTION_TYPES.TRANSFER,
                    amount,
                    description: `Transfer to ${toUserId}: ${description}`,
                    status: auth_constants_1.TRANSACTION_STATUSES.COMPLETED
                }
            });
            await tx.transaction.create({
                data: {
                    walletId: toWallet.id,
                    type: auth_constants_1.TRANSACTION_TYPES.CREDIT,
                    amount,
                    description: `Transfer from ${fromUserId}: ${description}`,
                    status: auth_constants_1.TRANSACTION_STATUSES.COMPLETED
                }
            });
            return {
                fromWallet: updatedFromWallet,
                toWallet: updatedToWallet
            };
        });
        return result;
    }
    // Get transaction history with filtering, sorting, and pagination
    async getTransactionHistory(userId, limit = 20, offset = 0, type, status, sortBy = 'createdAt', sortOrder = 'desc') {
        const wallet = await database_1.prisma.wallet.findUnique({
            where: { userId }
        });
        if (!wallet) {
            throw new Error('Wallet not found');
        }
        // Build where clause for filtering
        const whereClause = { walletId: wallet.id };
        if (type && type !== 'ALL') {
            whereClause.type = type;
        }
        if (status && status !== 'ALL') {
            whereClause.status = status;
        }
        // Build order by clause for sorting
        let orderByClause = {};
        switch (sortBy) {
            case 'amount':
                orderByClause.amount = sortOrder;
                break;
            case 'type':
                orderByClause.type = sortOrder;
                break;
            case 'status':
                orderByClause.status = sortOrder;
                break;
            case 'createdAt':
            default:
                orderByClause.createdAt = sortOrder;
                break;
        }
        // Get total count for pagination
        const total = await database_1.prisma.transaction.count({
            where: whereClause
        });
        // Get transactions with pagination
        const transactions = await database_1.prisma.transaction.findMany({
            where: whereClause,
            orderBy: orderByClause,
            take: limit,
            skip: offset
        });
        return {
            transactions: transactions,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: Math.floor(offset / limit) + 1
        };
    }
    // Admin method: Get any user's wallet (admin only)
    async getAnyUserWallet(userId) {
        const wallet = await database_1.prisma.wallet.findUnique({
            where: { userId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 5 // Show only 5 most recent transactions for consistency
                    // Admins can view all transactions on the dedicated transactions page
                }
            }
        });
        if (!wallet) {
            throw new Error('Wallet not found');
        }
        return {
            wallet: wallet,
            recentTransactions: wallet.transactions
        };
    }
    // User-to-user transfer
    async transferToUser(fromUserId, toUserId, amount, description, viaWhatsApp = false, recipientPhone) {
        // Use transaction to ensure data consistency
        const result = await database_1.prisma.$transaction(async (tx) => {
            const fromWallet = await tx.wallet.findUnique({
                where: { userId: fromUserId }
            });
            const toWallet = await tx.wallet.findUnique({
                where: { userId: toUserId }
            });
            if (!fromWallet || !toWallet) {
                throw new Error('One or both wallets not found');
            }
            if (Number(fromWallet.balance) < amount) {
                throw new Error('Insufficient funds for transfer');
            }
            // Update both wallets
            const updatedFromWallet = await tx.wallet.update({
                where: { userId: fromUserId },
                data: { balance: { decrement: amount } }
            });
            const updatedToWallet = await tx.wallet.update({
                where: { userId: toUserId },
                data: { balance: { increment: amount } }
            });
            // Create transaction records
            await tx.transaction.create({
                data: {
                    walletId: fromWallet.id,
                    type: auth_constants_1.TRANSACTION_TYPES.TRANSFER,
                    amount,
                    description: `Transfer to ${toUserId}: ${description}`,
                    status: auth_constants_1.TRANSACTION_STATUSES.COMPLETED
                }
            });
            await tx.transaction.create({
                data: {
                    walletId: toWallet.id,
                    type: auth_constants_1.TRANSACTION_TYPES.CREDIT,
                    amount,
                    description: `Transfer from ${fromUserId}: ${description}`,
                    status: auth_constants_1.TRANSACTION_STATUSES.COMPLETED
                }
            });
            // Send WhatsApp notification if enabled
            if (viaWhatsApp && recipientPhone) {
                try {
                    const sender = await database_1.prisma.user.findUnique({
                        where: { id: fromUserId },
                        select: { firstName: true, lastName: true }
                    });
                    if (sender) {
                        const senderName = `${sender.firstName} ${sender.lastName}`;
                        await whatsapp_service_1.whatsappService.sendTransferNotification(recipientPhone, amount, senderName);
                    }
                }
                catch (error) {
                    console.error('WhatsApp notification failed:', error);
                    // Don't fail the transfer if WhatsApp notification fails
                }
            }
            // Send email notifications and create in-app notifications
            try {
                // Get user details for email notifications
                const [sender, recipient] = await Promise.all([
                    database_1.prisma.user.findUnique({
                        where: { id: fromUserId },
                        select: { firstName: true, lastName: true, email: true }
                    }),
                    database_1.prisma.user.findUnique({
                        where: { id: toUserId },
                        select: { firstName: true, lastName: true, email: true }
                    })
                ]);
                if (sender) {
                    // Send money sent email to sender
                    await email_service_1.emailService.sendMoneySentEmail({ firstName: sender.firstName, lastName: sender.lastName, email: sender.email }, { amount, description, date: new Date().toISOString() }, recipient?.email || 'Unknown');
                    // Create money sent notification for sender
                    await notification_service_1.notificationService.createMoneySentNotification(fromUserId, amount, recipient?.firstName || 'Unknown User', `tx-${Date.now()}`);
                }
                if (recipient) {
                    // Send money received email to recipient
                    await email_service_1.emailService.sendMoneyReceivedEmail({ firstName: recipient.firstName, lastName: recipient.lastName, email: recipient.email }, { amount, description, date: new Date().toISOString() }, sender?.email || 'Unknown');
                    // Create money received notification for recipient
                    await notification_service_1.notificationService.createMoneyReceivedNotification(toUserId, amount, sender?.firstName || 'Unknown User', `tx-${Date.now()}`);
                }
            }
            catch (error) {
                console.error('Email and notification services failed:', error);
                // Don't fail the transfer if notifications fail
            }
            return {
                fromWallet: updatedFromWallet,
                toWallet: updatedToWallet
            };
        });
        return result;
    }
    // Request money from another user
    async requestMoney(requesterId, fromUserId, amount, description, viaWhatsApp = false, senderPhone) {
        // Create a money request record
        const moneyRequest = await database_1.prisma.moneyRequest.create({
            data: {
                requesterId,
                fromUserId,
                amount,
                description,
                status: 'PENDING',
                viaWhatsApp,
                senderPhone
            }
        });
        // Send WhatsApp notification if enabled
        if (viaWhatsApp && senderPhone) {
            try {
                const requester = await database_1.prisma.user.findUnique({
                    where: { id: requesterId },
                    select: { firstName: true, lastName: true }
                });
                if (requester) {
                    const requesterName = `${requester.firstName} ${requester.lastName}`;
                    await whatsapp_service_1.whatsappService.sendRequestNotification(senderPhone, amount, requesterName);
                }
            }
            catch (error) {
                console.error('WhatsApp notification failed:', error);
                // Don't fail the request if WhatsApp notification fails
            }
        }
        // Send email notification
        try {
            const [requester, sender] = await Promise.all([
                database_1.prisma.user.findUnique({
                    where: { id: requesterId },
                    select: { firstName: true, lastName: true, email: true }
                }),
                database_1.prisma.user.findUnique({
                    where: { id: fromUserId },
                    select: { firstName: true, lastName: true, email: true }
                })
            ]);
            if (sender) {
                // Send money request email to the person being asked for money
                await email_service_1.emailService.sendMoneyRequestEmail({ firstName: sender.firstName, lastName: sender.lastName, email: sender.email }, { amount, description, date: new Date().toISOString() }, requester?.email || 'Unknown');
                // Create money request notification for the person being asked for money
                await notification_service_1.notificationService.createMoneyRequestNotification(fromUserId, amount, requester?.firstName || 'Unknown User', moneyRequest.id);
            }
        }
        catch (error) {
            console.error('Email notification failed:', error);
            // Don't fail the request if email notification fails
        }
        return moneyRequest;
    }
    // Get pending money requests for a user
    async getPendingRequests(userId) {
        const requests = await database_1.prisma.moneyRequest.findMany({
            where: {
                OR: [
                    { requesterId: userId },
                    { fromUserId: userId }
                ],
                status: 'PENDING'
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                fromUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return requests;
    }
    // Approve money request
    async approveMoneyRequest(requestId, approverId) {
        const request = await database_1.prisma.moneyRequest.findUnique({
            where: { id: requestId }
        });
        if (!request) {
            throw new Error('Money request not found');
        }
        if (request.fromUserId !== approverId) {
            throw new Error('Only the requested user can approve this request');
        }
        if (request.status !== 'PENDING') {
            throw new Error('Request is not pending');
        }
        // Process the transfer
        const result = await this.transferToUser(request.fromUserId, request.requesterId, Number(request.amount), request.description || 'Money request transfer', request.viaWhatsApp, request.senderPhone || undefined);
        // Update request status
        await database_1.prisma.moneyRequest.update({
            where: { id: requestId },
            data: { status: 'APPROVED' }
        });
        // Send WhatsApp notification if enabled
        if (request.viaWhatsApp && request.senderPhone) {
            try {
                await whatsapp_service_1.whatsappService.sendApprovalNotification(request.senderPhone);
            }
            catch (error) {
                console.error('WhatsApp approval notification failed:', error);
            }
        }
        return result;
    }
    // Reject money request
    async rejectMoneyRequest(requestId, rejectorId, reason) {
        const request = await database_1.prisma.moneyRequest.findUnique({
            where: { id: requestId }
        });
        if (!request) {
            throw new Error('Money request not found');
        }
        if (request.fromUserId !== rejectorId) {
            throw new Error('Only the requested user can reject this request');
        }
        if (request.status !== 'PENDING') {
            throw new Error('Request is not pending');
        }
        // Update request status
        await database_1.prisma.moneyRequest.update({
            where: { id: requestId },
            data: {
                status: 'REJECTED',
                rejectionReason: reason
            }
        });
        // Send WhatsApp notification if enabled
        if (request.viaWhatsApp && request.senderPhone) {
            try {
                await whatsapp_service_1.whatsappService.sendRejectionNotification(request.senderPhone, reason);
            }
            catch (error) {
                console.error('WhatsApp rejection notification failed:', error);
            }
        }
    }
}
exports.WalletService = WalletService;
