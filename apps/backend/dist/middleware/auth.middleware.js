"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_js_1 = require("../config/database.js");
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Verify user still exists in database
        const user = await database_js_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true, email: true, status: true }
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }
        if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
            return res.status(401).json({
                success: false,
                message: 'Account is not active'
            });
        }
        req.user = {
            userId: user.id,
            role: user.role,
            email: user.email
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        console.error('Token verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Token verification failed'
        });
    }
};
exports.authenticateToken = authenticateToken;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};
exports.requireAdmin = requireAdmin;
