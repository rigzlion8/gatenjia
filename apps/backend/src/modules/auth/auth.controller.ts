import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { ICreateUserRequest, ILoginRequest } from './auth.types.js';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // User registration
  async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: ICreateUserRequest = req.body;
      
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

      const user = await this.authService.registerUser(userData);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed'
      });
    }
  }

  // User login
  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: ILoginRequest = req.body;
      
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
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Login failed'
      });
    }
  }

  // Google OAuth login
  async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { idToken } = req.body;
      
      if (!idToken) {
        res.status(400).json({
          success: false,
          message: 'Google ID token is required'
        });
        return;
      }

      // In a real implementation, you would verify the Google ID token
      // For now, we'll assume the frontend has already verified it
      // and we're receiving the user data
      const { googleId, email, firstName, lastName } = req.body;
      
      if (!googleId || !email || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          message: 'Google user data is incomplete'
        });
        return;
      }

      const authResponse = await this.authService.googleLogin(googleId, email, firstName, lastName);
      
      res.status(200).json({
        success: true,
        message: 'Google login successful',
        data: authResponse
      });
    } catch (error) {
      console.error('Google login error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Google login failed'
      });
    }
  }

  // Refresh token
  async refreshToken(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Token refresh failed'
      });
    }
  }

  // Get user profile
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      
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
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get profile'
      });
    }
  }

  // Logout
  async logout(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Logout failed'
      });
    }
  }
}
