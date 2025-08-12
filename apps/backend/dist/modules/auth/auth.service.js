"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../../config/database");
const wallet_service_1 = require("./wallet.service");
const email_service_1 = require("../../services/email.service");
const notification_service_1 = require("../../services/notification.service");
const auth_constants_1 = require("./auth.constants");
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
class AuthService {
    constructor() {
        this.walletService = new wallet_service_1.WalletService();
    }
    // Password hashing
    async hashPassword(password) {
        const saltRounds = 12;
        return bcryptjs_1.default.hash(password, saltRounds);
    }
    async comparePassword(password, hashedPassword) {
        return bcryptjs_1.default.compare(password, hashedPassword);
    }
    // JWT token generation
    generateAccessToken(userId, role) {
        return jsonwebtoken_1.default.sign({ userId, role }, JWT_SECRET, { expiresIn: '15m' });
    }
    generateRefreshToken(userId) {
        return jsonwebtoken_1.default.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    }
    // User registration
    async registerUser(userData) {
        const { email, firstName, lastName, password } = userData;
        // Check if user already exists
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        // Hash password
        const hashedPassword = await this.hashPassword(password);
        // Create user - always set role to USER for public registrations
        const user = await database_1.prisma.user.create({
            data: {
                email,
                firstName,
                lastName,
                password: hashedPassword,
                role: auth_constants_1.USER_ROLES.USER, // Always USER for public registrations
                status: auth_constants_1.USER_STATUSES.PENDING_VERIFICATION
            }
        });
        // Generate tokens for the newly created user
        const accessToken = this.generateAccessToken(user.id, user.role);
        const refreshToken = this.generateRefreshToken(user.id);
        // Store refresh token
        await database_1.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        });
        // Update last login
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });
        // Create wallet for the new user
        await this.walletService.createWallet(user.id);
        // Send welcome email notification
        try {
            await email_service_1.emailService.sendWelcomeEmail({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            });
        }
        catch (error) {
            console.error('Failed to send welcome email:', error);
            // Don't fail registration if email fails
        }
        // Create welcome notification
        try {
            await notification_service_1.notificationService.createWelcomeNotification(user.id, user.firstName);
        }
        catch (error) {
            console.error('Failed to create welcome notification:', error);
            // Don't fail registration if notification fails
        }
        // Return auth response with tokens
        const { password: _, ...userProfile } = user;
        return {
            user: userProfile,
            token: accessToken,
            refreshToken
        };
    }
    // User login
    async loginUser(loginData) {
        const { email, password } = loginData;
        // Find user
        const user = await database_1.prisma.user.findUnique({
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
        if (user.status === auth_constants_1.USER_STATUSES.INACTIVE || user.status === auth_constants_1.USER_STATUSES.SUSPENDED) {
            throw new Error('Account is not active. Please contact support.');
        }
        // Generate tokens
        const accessToken = this.generateAccessToken(user.id, user.role);
        const refreshToken = this.generateRefreshToken(user.id);
        // Store refresh token
        await database_1.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        });
        // Update last login
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });
        // Return auth response
        const { password: _, ...userProfile } = user;
        return {
            user: userProfile,
            token: accessToken,
            refreshToken
        };
    }
    // Google OAuth login
    async googleLogin(googleId, email, firstName, lastName) {
        let user = await database_1.prisma.user.findFirst({
            where: { OR: [{ googleId }, { email }] }
        });
        if (!user) {
            // Create new user with Google account
            user = await database_1.prisma.user.create({
                data: {
                    email,
                    firstName,
                    lastName,
                    password: '', // No password for Google users
                    googleId,
                    role: auth_constants_1.USER_ROLES.USER,
                    status: auth_constants_1.USER_STATUSES.ACTIVE, // Google users are active by default
                    emailVerified: true
                }
            });
        }
        else if (!user.googleId) {
            // Link existing email account with Google
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: { googleId, emailVerified: true }
            });
        }
        // Generate tokens
        const accessToken = this.generateAccessToken(user.id, user.role);
        const refreshToken = this.generateRefreshToken(user.id);
        // Store refresh token
        await database_1.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
        // Update last login
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });
        const { password: _, ...userProfile } = user;
        return {
            user: userProfile,
            token: accessToken,
            refreshToken
        };
    }
    // Refresh token
    async refreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
            const refreshTokenRecord = await database_1.prisma.refreshToken.findUnique({
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
            await database_1.prisma.refreshToken.update({
                where: { id: refreshTokenRecord.id },
                data: {
                    token: newRefreshToken,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }
            });
            const { password: _, ...userProfile } = user;
            return {
                user: userProfile,
                token: accessToken,
                refreshToken: newRefreshToken
            };
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
    // Helper method to check if user can access features
    canUserAccessFeatures(userStatus) {
        return userStatus === auth_constants_1.USER_STATUSES.ACTIVE || userStatus === auth_constants_1.USER_STATUSES.PENDING_VERIFICATION;
    }
    // Helper method to check if user has full access
    hasFullAccess(userStatus) {
        return userStatus === auth_constants_1.USER_STATUSES.ACTIVE;
    }
    // Search users for money transfers
    async searchUsers(query, currentUserId) {
        const searchQuery = query.toLowerCase();
        const users = await database_1.prisma.user.findMany({
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
                    { status: { in: [auth_constants_1.USER_STATUSES.ACTIVE, auth_constants_1.USER_STATUSES.PENDING_VERIFICATION] } } // Only active users
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
    async getUserById(userId, adminUserId) {
        // Verify admin user exists and has admin role
        const adminUser = await database_1.prisma.user.findUnique({
            where: { id: adminUserId }
        });
        if (!adminUser || adminUser.role !== auth_constants_1.USER_ROLES.ADMIN) {
            throw new Error('Unauthorized: Only admins can view user details');
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new Error('User not found');
        }
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    // Admin-only: Update user
    async updateUser(userId, updateData, adminUserId) {
        // Verify admin user exists and has admin role
        const adminUser = await database_1.prisma.user.findUnique({
            where: { id: adminUserId }
        });
        if (!adminUser || adminUser.role !== auth_constants_1.USER_ROLES.ADMIN) {
            throw new Error('Unauthorized: Only admins can update users');
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Don't allow updating sensitive fields
        const { password, id, ...safeUpdateData } = updateData;
        const updatedUser = await database_1.prisma.user.update({
            where: { id: userId },
            data: safeUpdateData
        });
        const { password: _, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    }
    // Admin-only: Delete user
    async deleteUser(userId, adminUserId) {
        // Verify admin user exists and has admin role
        const adminUser = await database_1.prisma.user.findUnique({
            where: { id: adminUserId }
        });
        if (!adminUser || adminUser.role !== auth_constants_1.USER_ROLES.ADMIN) {
            throw new Error('Unauthorized: Only admins can delete users');
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Prevent admin from deleting themselves
        if (userId === adminUserId) {
            throw new Error('Cannot delete your own account');
        }
        await database_1.prisma.user.delete({
            where: { id: userId }
        });
    }
    // Admin-only: Create user with specific role
    async createUserAsAdmin(userData, role, adminUserId) {
        // Verify admin user exists and has admin role
        const adminUser = await database_1.prisma.user.findUnique({
            where: { id: adminUserId }
        });
        if (!adminUser || adminUser.role !== auth_constants_1.USER_ROLES.ADMIN) {
            throw new Error('Unauthorized: Only admins can create users with specific roles');
        }
        const { email, firstName, lastName, password } = userData;
        // Check if user already exists
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        // Hash password
        const hashedPassword = await this.hashPassword(password);
        // Create user with specified role
        const user = await database_1.prisma.user.create({
            data: {
                email,
                firstName,
                lastName,
                password: hashedPassword,
                role,
                status: auth_constants_1.USER_STATUSES.ACTIVE // Admin-created users are active by default
            }
        });
        // Return user profile without password
        const { password: _, ...userProfile } = user;
        return userProfile;
    }
    // Admin-only: Update user role
    async updateUserRole(userId, newRole, adminUserId) {
        // Verify admin user exists and has admin role
        const adminUser = await database_1.prisma.user.findUnique({
            where: { id: adminUserId }
        });
        if (!adminUser || adminUser.role !== auth_constants_1.USER_ROLES.ADMIN) {
            throw new Error('Unauthorized: Only admins can update user roles');
        }
        // Update user role
        const user = await database_1.prisma.user.update({
            where: { id: userId },
            data: { role: newRole }
        });
        // Return user profile without password
        const { password: _, ...userProfile } = user;
        return userProfile;
    }
    // Update user status (admin only)
    async updateUserStatus(userId, newStatus) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new Error('User not found');
        }
        const updatedUser = await database_1.prisma.user.update({
            where: { id: userId },
            data: { status: newStatus }
        });
        return updatedUser;
    }
    // Update user password (admin only)
    async updateUserPassword(userId, newPassword) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new Error('User not found');
        }
        const hashedPassword = await this.hashPassword(newPassword);
        const updatedUser = await database_1.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
        return updatedUser;
    }
    // Get all users (admin only)
    async getAllUsers(adminUserId) {
        // Verify admin user exists and has admin role
        const adminUser = await database_1.prisma.user.findUnique({
            where: { id: adminUserId }
        });
        if (!adminUser || adminUser.role !== auth_constants_1.USER_ROLES.ADMIN) {
            throw new Error('Unauthorized: Only admins can view all users');
        }
        const users = await database_1.prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
        // Return user profiles without passwords
        return users.map((user) => {
            const { password: _, ...userProfile } = user;
            return userProfile;
        });
    }
    // Get user profile
    async getUserProfile(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new Error('User not found');
        }
        const { password: _, ...userProfile } = user;
        return userProfile;
    }
    // Logout
    async logout(refreshToken) {
        await database_1.prisma.refreshToken.delete({
            where: { token: refreshToken }
        });
    }
}
exports.AuthService = AuthService;
