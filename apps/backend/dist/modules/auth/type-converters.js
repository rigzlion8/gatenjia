"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decimalToNumber = decimalToNumber;
exports.prismaUserToIUser = prismaUserToIUser;
exports.prismaTransactionToITransaction = prismaTransactionToITransaction;
exports.prismaWalletToIWallet = prismaWalletToIWallet;
exports.prismaUsersToIUsers = prismaUsersToIUsers;
/**
 * Convert Prisma Decimal to number
 */
function decimalToNumber(decimal) {
    if (decimal === null || decimal === undefined)
        return 0;
    return Number(decimal);
}
/**
 * Convert Prisma user to IUser interface
 */
function prismaUserToIUser(prismaUser) {
    return {
        ...prismaUser,
        balance: prismaUser.balance ? decimalToNumber(prismaUser.balance) : 0
    };
}
/**
 * Convert Prisma transaction to ITransaction interface
 */
function prismaTransactionToITransaction(prismaTransaction) {
    return {
        ...prismaTransaction,
        amount: prismaTransaction.amount ? decimalToNumber(prismaTransaction.amount) : 0
    };
}
/**
 * Convert Prisma wallet to IWallet interface
 */
function prismaWalletToIWallet(prismaWallet) {
    return {
        ...prismaWallet,
        balance: prismaWallet.balance ? decimalToNumber(prismaWallet.balance) : 0
    };
}
/**
 * Convert Prisma user array to IUser array
 */
function prismaUsersToIUsers(prismaUsers) {
    return prismaUsers.map(prismaUserToIUser);
}
