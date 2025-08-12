// Constants to replace enum values
export const USER_ROLES = {
  USER: 'USER' as const,
  ADMIN: 'ADMIN' as const,
  CHECKER: 'CHECKER' as const,
  AUDITOR: 'AUDITOR' as const,
  COMPLIANCE: 'COMPLIANCE' as const
} as const;

export const USER_STATUSES = {
  ACTIVE: 'ACTIVE' as const,
  INACTIVE: 'INACTIVE' as const,
  SUSPENDED: 'SUSPENDED' as const,
  PENDING_VERIFICATION: 'PENDING_VERIFICATION' as const
} as const;

export const TRANSACTION_TYPES = {
  CREDIT: 'CREDIT' as const,
  DEBIT: 'DEBIT' as const,
  TRANSFER: 'TRANSFER' as const,
  WITHDRAWAL: 'WITHDRAWAL' as const,
  DEPOSIT: 'DEPOSIT' as const
} as const;

export const TRANSACTION_STATUSES = {
  PENDING: 'PENDING' as const,
  COMPLETED: 'COMPLETED' as const,
  FAILED: 'FAILED' as const,
  CANCELLED: 'CANCELLED' as const
} as const;
