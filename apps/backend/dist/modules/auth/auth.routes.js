"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_js_1 = require("./auth.controller.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
const authController = new auth_controller_js_1.AuthController();
// Public routes (no authentication required)
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/google-login', authController.googleLogin.bind(authController));
router.post('/refresh-token', authController.refreshToken.bind(authController));
// Protected routes (authentication required)
router.get('/profile', auth_middleware_js_1.authenticateToken, authController.getProfile.bind(authController));
router.post('/logout', auth_middleware_js_1.authenticateToken, authController.logout.bind(authController));
// Admin-only routes (authentication + admin role required)
router.post('/admin/create-user', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, authController.createUserAsAdmin.bind(authController));
router.put('/admin/update-user-role', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, authController.updateUserRole.bind(authController));
router.put('/admin/update-user-status', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, authController.updateUserStatus.bind(authController));
router.put('/admin/update-user-password', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, authController.updateUserPassword.bind(authController));
// User management routes (admin only)
router.get('/admin/users', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, authController.getAllUsers.bind(authController));
router.get('/admin/users/:id', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, authController.getUserById.bind(authController));
router.put('/admin/users/:id', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, authController.updateUser.bind(authController));
router.delete('/admin/users/:id', auth_middleware_js_1.authenticateToken, auth_middleware_js_1.requireAdmin, authController.deleteUser.bind(authController));
// User search route (authenticated users can search for other users)
router.get('/search-users', auth_middleware_js_1.authenticateToken, authController.searchUsers.bind(authController));
exports.default = router;
