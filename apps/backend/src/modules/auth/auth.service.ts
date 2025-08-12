import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database.js';
import { WalletService } from './wallet.service.js';
import { emailService } from '../../services/email.service.js';
import { notificationService } from '../../services/notification.service.js';
import { 
  IUser, 
  ICreateUserRequest, 
  ILoginRequest, 
  IAuthResponse, 
  IUserProfile,
  UserRole,
  UserStatus 
} from './auth.types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';

export class AuthService {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

  // Password hashing
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  private async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // JWT token generation
  private generateAccessToken(userId: string, role: UserRole): string {
    return jwt.sign(
      { userId, role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }

  // User registration
  async registerUser(userData: ICreateUserRequest): Promise<IAuthResponse> {
    const { email, firstName, lastName, password } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user - always set role to USER for public registrations
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role: UserRole.USER, // Always USER for public registrations
        status: UserStatus.PENDING_VERIFICATION
      }
    });

    // Generate tokens for the newly created user
    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Create wallet for the new user
    await this.walletService.createWallet(user.id);

    // Send welcome email notification
    try {
      await emailService.sendWelcomeEmail({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't fail registration if email fails
    }

    // Create welcome notification
    try {
      await notificationService.createWelcomeNotification(user.id, user.firstName);
    } catch (error) {
      console.error('Failed to create welcome notification:', error);
      // Don't fail registration if notification fails
    }

    // Return auth response with tokens
    const { password: _, ...userProfile } = user;
    return {
      user: userProfile as Omit<IUser, 'password'>,
      token: accessToken,
      refreshToken
    };
  }

  // User login
  async loginUser(loginData: ILoginRequest): Promise<IAuthResponse> {
    const { email, password } = loginData;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Check user status - allow ACTIVE and PENDING_VERIFICATION users to log in
    if (user.status === UserStatus.INACTIVE || user.status === UserStatus.SUSPENDED) {
      throw new Error('Account is not active. Please contact support.');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Return auth response
    const { password: _, ...userProfile } = user;
    return {
      user: userProfile as Omit<IUser, 'password'>,
      token: accessToken,
      refreshToken
    };
  }

  // Google OAuth login
  async googleLogin(googleId: string, email: string, firstName: string, lastName: string): Promise<IAuthResponse> {
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] }
    });

    if (!user) {
      // Create new user with Google account
      user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          password: '', // No password for Google users
          googleId,
          role: UserRole.USER,
          status: UserStatus.ACTIVE, // Google users are active by default
          emailVerified: true
        }
      });
    } else if (!user.googleId) {
      // Link existing email account with Google
      await prisma.user.update({
        where: { id: user.id },
        data: { googleId, emailVerified: true }
      });
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const { password: _, ...userProfile } = user;
    return {
      user: userProfile as Omit<IUser, 'password'>,
      token: accessToken,
      refreshToken
    };
  }

  // Refresh token
  async refreshToken(token: string): Promise<IAuthResponse> {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
      
      const refreshTokenRecord = await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!refreshTokenRecord || refreshTokenRecord.expiresAt < new Date()) {
        throw new Error('Invalid or expired refresh token');
      }

      const user = refreshTokenRecord.user;
      const accessToken = this.generateAccessToken(user.id, user.role);
      const newRefreshToken = this.generateRefreshToken(user.id);

      // Update refresh token
      await prisma.refreshToken.update({
        where: { id: refreshTokenRecord.id },
        data: {
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      const { password: _, ...userProfile } = user;
      return {
        user: userProfile as Omit<IUser, 'password'>,
        token: accessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Helper method to check if user can access features
  canUserAccessFeatures(userStatus: UserStatus): boolean {
    return userStatus === UserStatus.ACTIVE || userStatus === UserStatus.PENDING_VERIFICATION;
  }

  // Helper method to check if user has full access
  hasFullAccess(userStatus: UserStatus): boolean {
    return userStatus === UserStatus.ACTIVE;
  }

  // Search users for money transfers
  async searchUsers(query: string, currentUserId: string): Promise<Omit<IUser, 'password'>[]> {
    const searchQuery = query.toLowerCase();
    
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { firstName: { contains: searchQuery, mode: 'insensitive' } },
              { lastName: { contains: searchQuery, mode: 'insensitive' } },
              { email: { contains: searchQuery, mode: 'insensitive' } }
            ]
          },
          { id: { not: currentUserId } }, // Exclude current user
          { status: { in: [UserStatus.ACTIVE, UserStatus.PENDING_VERIFICATION] } } // Only active users
        ]
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        phoneNumber: true
      },
      take: 10 // Limit results
    });

    return users;
  }

  // Admin-only: Get user by ID
  async getUserById(userId: string, adminUserId: string): Promise<Omit<IUser, 'password'>> {
    // Verify admin user exists and has admin role
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId }
    });

    if (!adminUser || adminUser.role !== UserRole.ADMIN) {
      throw new Error('Unauthorized: Only admins can view user details');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Admin-only: Update user
  async updateUser(userId: string, updateData: Partial<IUser>, adminUserId: string): Promise<Omit<IUser, 'password'>> {
    // Verify admin user exists and has admin role
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId }
    });

    if (!adminUser || adminUser.role !== UserRole.ADMIN) {
      throw new Error('Unauthorized: Only admins can update users');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Don't allow updating sensitive fields
    const { password, id, ...safeUpdateData } = updateData;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: safeUpdateData
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  // Admin-only: Delete user
  async deleteUser(userId: string, adminUserId: string): Promise<void> {
    // Verify admin user exists and has admin role
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId }
    });

    if (!adminUser || adminUser.role !== UserRole.ADMIN) {
      throw new Error('Unauthorized: Only admins can delete users');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Prevent admin from deleting themselves
    if (userId === adminUserId) {
      throw new Error('Cannot delete your own account');
    }

    await prisma.user.delete({
      where: { id: userId }
    });
  }

  // Admin-only: Create user with specific role
  async createUserAsAdmin(userData: ICreateUserRequest, role: UserRole, adminUserId: string): Promise<IUserProfile> {
    // Verify admin user exists and has admin role
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId }
    });

    if (!adminUser || adminUser.role !== UserRole.ADMIN) {
      throw new Error('Unauthorized: Only admins can create users with specific roles');
    }

    const { email, firstName, lastName, password } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user with specified role
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role,
        status: UserStatus.ACTIVE // Admin-created users are active by default
      }
    });

    // Return user profile without password
    const { password: _, ...userProfile } = user;
    return userProfile as IUserProfile;
  }

  // Admin-only: Update user role
  async updateUserRole(userId: string, newRole: UserRole, adminUserId: string): Promise<IUserProfile> {
    // Verify admin user exists and has admin role
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId }
    });

    if (!adminUser || adminUser.role !== UserRole.ADMIN) {
      throw new Error('Unauthorized: Only admins can update user roles');
    }

    // Update user role
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole }
    });

    // Return user profile without password
    const { password: _, ...userProfile } = user;
    return userProfile as IUserProfile;
  }

  // Update user status (admin only)
  async updateUserStatus(userId: string, newStatus: UserStatus): Promise<IUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus }
    });

    return updatedUser as IUser;
  }

  // Update user password (admin only)
  async updateUserPassword(userId: string, newPassword: string): Promise<IUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const hashedPassword = await this.hashPassword(newPassword);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return updatedUser as IUser;
  }

  // Get all users (admin only)
  async getAllUsers(adminUserId: string): Promise<IUserProfile[]> {
    // Verify admin user exists and has admin role
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId }
    });

    if (!adminUser || adminUser.role !== UserRole.ADMIN) {
      throw new Error('Unauthorized: Only admins can view all users');
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Return user profiles without passwords
    return users.map((user: IUser) => {
      const { password: _, ...userProfile } = user;
      return userProfile as IUserProfile;
    });
  }

  // Get user profile
  async getUserProfile(userId: string): Promise<IUserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const { password: _, ...userProfile } = user;
    return userProfile as IUserProfile;
  }

  // Logout
  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.delete({
      where: { token: refreshToken }
    });
  }
}
