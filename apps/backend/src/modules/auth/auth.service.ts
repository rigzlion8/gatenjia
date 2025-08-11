import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database.js';
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
  async registerUser(userData: ICreateUserRequest): Promise<IUserProfile> {
    const { email, firstName, lastName, password, role = UserRole.USER } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role,
        status: UserStatus.PENDING_VERIFICATION
      }
    });

    // Return user profile without password
    const { password: _, ...userProfile } = user;
    return userProfile as IUserProfile;
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

    // Check user status
    if (user.status !== UserStatus.ACTIVE) {
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
          status: UserStatus.ACTIVE,
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
