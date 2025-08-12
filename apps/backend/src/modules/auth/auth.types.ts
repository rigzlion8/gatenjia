// Use string literals instead of enums for better Prisma compatibility
export type UserRole = 'USER' | 'ADMIN' | 'CHECKER' | 'AUDITOR' | 'COMPLIANCE';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export type TransactionType = 'CREDIT' | 'DEBIT' | 'TRANSFER' | 'WITHDRAWAL' | 'DEPOSIT';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  googleId?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface IWallet {
  id: string;
  userId: string;
  balance: number | any; // Allow Prisma Decimal type
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number | any; // Allow Prisma Decimal type
  description: string;
  reference?: string;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IGoogleAuthRequest {
  idToken: string;
}

export interface IAuthResponse {
  user: Omit<IUser, 'password'>;
  token: string;
  refreshToken: string;
}

export interface IUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface IWalletResponse {
  wallet: IWallet;
  recentTransactions: ITransaction[];
}
