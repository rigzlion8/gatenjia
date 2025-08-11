import { prisma } from '../../config/database.js';
import { IWallet, ITransaction, TransactionType, TransactionStatus } from './auth.types.js';

export class WalletService {
  // Create wallet for new user
  async createWallet(userId: string): Promise<IWallet> {
    const wallet = await prisma.wallet.create({
      data: {
        userId,
        balance: 100, // 100 G coins = $100 USD
        currency: 'G_COIN'
      }
    });

    // Create initial transaction record
    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: TransactionType.CREDIT,
        amount: 100,
        description: 'Initial wallet balance - Welcome bonus',
        status: TransactionStatus.COMPLETED
      }
    });

    return wallet as IWallet;
  }

  // Get user wallet with recent transactions
  async getUserWallet(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10 // Last 10 transactions
        }
      }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return {
      wallet: wallet as IWallet,
      recentTransactions: wallet.transactions as ITransaction[]
    };
  }

  // Get wallet balance
  async getWalletBalance(userId: string): Promise<number> {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { balance: true }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return Number(wallet.balance);
  }

  // Add funds to wallet
  async addFunds(userId: string, amount: number, description: string): Promise<IWallet> {
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Update balance
    const updatedWallet = await prisma.wallet.update({
      where: { userId },
      data: {
        balance: {
          increment: amount
        }
      }
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: TransactionType.CREDIT,
        amount,
        description,
        status: TransactionStatus.COMPLETED
      }
    });

    return updatedWallet as IWallet;
  }

  // Deduct funds from wallet
  async deductFunds(userId: string, amount: number, description: string): Promise<IWallet> {
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (Number(wallet.balance) < amount) {
      throw new Error('Insufficient funds');
    }

    // Update balance
    const updatedWallet = await prisma.wallet.update({
      where: { userId },
      data: {
        balance: {
          decrement: amount
        }
      }
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: TransactionType.DEBIT,
        amount,
        description,
        status: TransactionStatus.COMPLETED
      }
    });

    return updatedWallet as IWallet;
  }

  // Transfer funds between wallets
  async transferFunds(
    fromUserId: string, 
    toUserId: string, 
    amount: number, 
    description: string
  ): Promise<{ fromWallet: IWallet; toWallet: IWallet }> {
    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx: any) => {
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
          type: TransactionType.TRANSFER,
          amount,
          description: `Transfer to ${toUserId}: ${description}`,
          status: TransactionStatus.COMPLETED
        }
      });

      await tx.transaction.create({
        data: {
          walletId: toWallet.id,
          type: TransactionType.CREDIT,
          amount,
          description: `Transfer from ${fromUserId}: ${description}`,
          status: TransactionStatus.COMPLETED
        }
      });

      return {
        fromWallet: updatedFromWallet as IWallet,
        toWallet: updatedToWallet as IWallet
      };
    });

    return result;
  }

  // Get transaction history
  async getTransactionHistory(userId: string, limit: number = 50, offset: number = 0) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const transactions = await prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    return transactions as ITransaction[];
  }

  // Admin method: Get any user's wallet (admin only)
  async getAnyUserWallet(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10 // Last 10 transactions
        }
      }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return {
      wallet: wallet as IWallet,
      recentTransactions: wallet.transactions as ITransaction[]
    };
  }
}
