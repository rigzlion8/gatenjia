export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  CHECKER = 'checker',
  AUDITOR = 'auditor',
  COMPLIANCE = 'compliance'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  googleId?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface ICreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role?: UserRole;
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
