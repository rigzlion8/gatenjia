export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  CHECKER = 'CHECKER',
  AUDITOR = 'AUDITOR',
  COMPLIANCE = 'COMPLIANCE'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
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
