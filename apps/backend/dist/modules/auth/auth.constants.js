"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRANSACTION_STATUSES = exports.TRANSACTION_TYPES = exports.USER_STATUSES = exports.USER_ROLES = void 0;
// Constants to replace enum values
exports.USER_ROLES = {
    USER: 'USER',
    ADMIN: 'ADMIN',
    CHECKER: 'CHECKER',
    AUDITOR: 'AUDITOR',
    COMPLIANCE: 'COMPLIANCE'
};
exports.USER_STATUSES = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
    PENDING_VERIFICATION: 'PENDING_VERIFICATION'
};
exports.TRANSACTION_TYPES = {
    CREDIT: 'CREDIT',
    DEBIT: 'DEBIT',
    TRANSFER: 'TRANSFER',
    WITHDRAWAL: 'WITHDRAWAL',
    DEPOSIT: 'DEPOSIT'
};
exports.TRANSACTION_STATUSES = {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED'
};
