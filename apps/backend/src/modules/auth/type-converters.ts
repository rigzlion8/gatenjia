import { Decimal } from '@prisma/client/runtime/library';

/**
 * Convert Prisma Decimal to number
 */
export function decimalToNumber(decimal: Decimal | null | undefined): number {
  if (decimal === null || decimal === undefined) return 0;
  return Number(decimal);
}

/**
 * Convert Prisma user to IUser interface
 */
export function prismaUserToIUser(prismaUser: any): any {
  return {
    ...prismaUser,
    balance: prismaUser.balance ? decimalToNumber(prismaUser.balance) : 0
  };
}

/**
 * Convert Prisma transaction to ITransaction interface
 */
export function prismaTransactionToITransaction(prismaTransaction: any): any {
  return {
    ...prismaTransaction,
    amount: prismaTransaction.amount ? decimalToNumber(prismaTransaction.amount) : 0
  };
}

/**
 * Convert Prisma wallet to IWallet interface
 */
export function prismaWalletToIWallet(prismaWallet: any): any {
  return {
    ...prismaWallet,
    balance: prismaWallet.balance ? decimalToNumber(prismaWallet.balance) : 0
  };
}
