import { Router } from 'express';
import { AuthController } from './auth.controller.js';

const router = Router();
const authController = new AuthController();

// Public routes (no authentication required)
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/google-login', authController.googleLogin.bind(authController));
router.post('/refresh-token', authController.refreshToken.bind(authController));

// Protected routes (authentication required)
router.get('/profile', authController.getProfile.bind(authController));
router.post('/logout', authController.logout.bind(authController));

export default router;
