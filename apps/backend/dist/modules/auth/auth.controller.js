"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_js_1 = require("./auth.service.js");
class AuthController {
    constructor() {
        this.authService = new auth_service_js_1.AuthService();
    }
    // User registration
    async register(req, res) {
        try {
            const userData = req.body;
            // Validate required fields
            if (!userData.email || !userData.firstName || !userData.lastName || !userData.password) {
                res.status(400).json({
                    success: false,
                    message: 'All fields are required'
                });
                return;
            }
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
                return;
            }
            // Validate password strength
            if (userData.password.length < 8) {
                res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters long'
                });
                return;
            }
            const authResponse = await this.authService.registerUser(userData);
            res.status(201).json({
                success: true,
                message: 'User registered and logged in successfully',
                data: authResponse
            });
        }
        catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Registration failed'
            });
        }
    }
    // User login
    async login(req, res) {
        try {
            const loginData = req.body;
            // Validate required fields
            if (!loginData.email || !loginData.password) {
                res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
                return;
            }
            const authResponse = await this.authService.loginUser(loginData);
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: authResponse
            });
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(401).json({
                success: false,
                message: error instanceof Error ? error.message : 'Login failed'
            });
        }
    }
    // Google OAuth login
    async googleLogin(req, res) {
        try {
            const { idToken, email, firstName, lastName } = req.body;
            if (!idToken || !email || !firstName || !lastName) {
                res.status(400).json({
                    success: false,
                    message: 'Google ID token, email, firstName, and lastName are required'
                });
                return;
            }
            const authResponse = await this.authService.googleLogin(idToken, email, firstName, lastName);
            res.status(200).json({
                success: true,
                message: 'Google login successful',
                data: authResponse
            });
        }
        catch (error) {
            console.error('Google login error:', error);
            res.status(401).json({
                success: false,
                message: error instanceof Error ? error.message : 'Google login failed'
            });
        }
    }
    // Search users (for money transfers)
    async searchUsers(req, res) {
        try {
            const { q } = req.query;
            const currentUserId = req.user?.userId;
            if (!q || typeof q !== 'string' || q.length < 2) {
                res.status(400).json({
                    success: false,
                    message: 'Search query must be at least 2 characters long'
                });
                return;
            }
            const users = await this.authService.searchUsers(q, currentUserId);
            res.status(200).json({
                success: true,
                data: users
            });
        }
        catch (error) {
            console.error('User search error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'User search failed'
            });
        }
    }
    // Refresh token
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({
                    success: false,
                    message: 'Refresh token is required'
                });
                return;
            }
            const authResponse = await this.authService.refreshToken(refreshToken);
            res.status(200).json({
                success: true,
                message: 'Token refreshed successfully',
                data: authResponse
            });
        }
        catch (error) {
            console.error('Token refresh error:', error);
            res.status(401).json({
                success: false,
                message: error instanceof Error ? error.message : 'Token refresh failed'
            });
        }
    }
    // Get user profile
    async getProfile(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            const userProfile = await this.authService.getUserProfile(userId);
            res.status(200).json({
                success: true,
                data: userProfile
            });
        }
        catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get profile'
            });
        }
    }
    // Logout
    async logout(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({
                    success: false,
                    message: 'Refresh token is required'
                });
                return;
            }
            await this.authService.logout(refreshToken);
            res.status(200).json({
                success: true,
                message: 'Logout successful'
            });
        }
        catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Logout failed'
            });
        }
    }
    // Admin-only: Create user with specific role
    async createUserAsAdmin(req, res) {
        try {
            const { email, firstName, lastName, password, role } = req.body;
            const adminUserId = req.user?.userId;
            if (!adminUserId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            if (!email || !firstName || !lastName || !password || !role) {
                res.status(400).json({
                    success: false,
                    message: 'All fields including role are required'
                });
                return;
            }
            const user = await this.authService.createUserAsAdmin({ email, firstName, lastName, password }, role, adminUserId);
            res.status(201).json({
                success: true,
                message: 'User created successfully by admin',
                data: user
            });
        }
        catch (error) {
            console.error('Admin create user error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to create user'
            });
        }
    }
    // Admin-only: Update user role
    async updateUserRole(req, res) {
        try {
            const { userId, newRole } = req.body;
            const adminUserId = req.user?.userId;
            if (!adminUserId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            if (!userId || !newRole) {
                res.status(400).json({
                    success: false,
                    message: 'User ID and new role are required'
                });
                return;
            }
            const user = await this.authService.updateUserRole(userId, newRole, adminUserId);
            res.status(200).json({
                success: true,
                message: 'User role updated successfully',
                data: user
            });
        }
        catch (error) {
            console.error('Update user role error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update user role'
            });
        }
    }
    // Update user status (admin only)
    async updateUserStatus(req, res) {
        try {
            const { userId, newStatus } = req.body;
            if (!userId || !newStatus) {
                res.status(400).json({
                    success: false,
                    message: 'User ID and new status are required'
                });
                return;
            }
            const updatedUser = await this.authService.updateUserStatus(userId, newStatus);
            res.status(200).json({
                success: true,
                message: 'User status updated successfully',
                data: updatedUser
            });
        }
        catch (error) {
            console.error('Update user status error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update user status'
            });
        }
    }
    // Update user password (admin only)
    async updateUserPassword(req, res) {
        try {
            const { userId, newPassword } = req.body;
            if (!userId || !newPassword) {
                res.status(400).json({
                    success: false,
                    message: 'User ID and new password are required'
                });
                return;
            }
            const updatedUser = await this.authService.updateUserPassword(userId, newPassword);
            res.status(200).json({
                success: true,
                message: 'User password updated successfully',
                data: updatedUser
            });
        }
        catch (error) {
            console.error('Update user password error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update user password'
            });
        }
    }
    // Admin-only: Get all users
    async getAllUsers(req, res) {
        try {
            const adminUserId = req.user?.userId;
            if (!adminUserId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            const users = await this.authService.getAllUsers(adminUserId);
            res.status(200).json({
                success: true,
                data: users
            });
        }
        catch (error) {
            console.error('Get all users error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get users'
            });
        }
    }
    // Admin-only: Get user by ID
    async getUserById(req, res) {
        try {
            const adminUserId = req.user?.userId;
            const { id } = req.params;
            if (!adminUserId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            const user = await this.authService.getUserById(id, adminUserId);
            res.status(200).json({
                success: true,
                data: user
            });
        }
        catch (error) {
            console.error('Get user by ID error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get user'
            });
        }
    }
    // Admin-only: Update user
    async updateUser(req, res) {
        try {
            const adminUserId = req.user?.userId;
            const { id } = req.params;
            const updateData = req.body;
            if (!adminUserId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            const updatedUser = await this.authService.updateUser(id, updateData, adminUserId);
            res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: updatedUser
            });
        }
        catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update user'
            });
        }
    }
    // Admin-only: Delete user
    async deleteUser(req, res) {
        try {
            const adminUserId = req.user?.userId;
            const { id } = req.params;
            if (!adminUserId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            await this.authService.deleteUser(id, adminUserId);
            res.status(200).json({
                success: true,
                message: 'User deleted successfully'
            });
        }
        catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to delete user'
            });
        }
    }
}
exports.AuthController = AuthController;
