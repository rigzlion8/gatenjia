import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.middleware.js';

const router = Router();
const authController = new AuthController();

// Public routes (no authentication required)
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/google-login', authController.googleLogin.bind(authController));
router.post('/refresh-token', authController.refreshToken.bind(authController));

// Protected routes (authentication required)
router.get('/profile', authenticateToken, authController.getProfile.bind(authController));
router.post('/logout', authenticateToken, authController.logout.bind(authController));

// Admin-only routes (authentication + admin role required)
router.post('/admin/create-user', authenticateToken, requireAdmin, authController.createUserAsAdmin.bind(authController));
router.put('/admin/update-user-role', authenticateToken, requireAdmin, authController.updateUserRole.bind(authController));
router.put('/admin/update-user-status', authenticateToken, requireAdmin, authController.updateUserStatus.bind(authController));
router.put('/admin/update-user-password', authenticateToken, requireAdmin, authController.updateUserPassword.bind(authController));
// User management routes (admin only)
router.get('/admin/users', authenticateToken, requireAdmin, authController.getAllUsers.bind(authController));
router.get('/admin/users/:id', authenticateToken, requireAdmin, authController.getUserById.bind(authController));
router.put('/admin/users/:id', authenticateToken, requireAdmin, authController.updateUser.bind(authController));
router.delete('/admin/users/:id', authenticateToken, requireAdmin, authController.deleteUser.bind(authController));

// User search route (authenticated users can search for other users)
router.get('/search-users', authenticateToken, authController.searchUsers.bind(authController));

export default router;
