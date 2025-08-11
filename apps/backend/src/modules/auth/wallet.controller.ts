import { Request, Response } from 'express';
import { prisma } from '../../config/database.js';
import { WalletService } from './wallet.service.js';

export class WalletController {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

  // Get user wallet
  async getUserWallet(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      
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
    } catch (error) {
      console.error('Get wallet error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get wallet'
      });
    }
  }

  // Get wallet balance
  async getWalletBalance(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      
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
    } catch (error) {
      console.error('Get balance error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get balance'
      });
    }
  }

  // Get transaction history
  async getTransactionHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const transactions = await this.walletService.getTransactionHistory(userId, limit, offset);
      
      res.status(200).json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error('Get transaction history error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get transaction history'
      });
    }
  }

  // Transfer funds (admin only for now)
  async transferFunds(req: Request, res: Response): Promise<void> {
    try {
      const adminUserId = (req as any).user?.userId;
      const { fromUserId, toUserId, amount, description } = req.body;
      
      if (!adminUserId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      // Verify admin role
      const adminUser = await prisma.user.findUnique({
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
    } catch (error) {
      console.error('Transfer funds error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to transfer funds'
      });
    }
  }
}
