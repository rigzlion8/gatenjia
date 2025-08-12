"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_js_1 = require("./payment.controller.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
const paymentController = new payment_controller_js_1.PaymentController();
// All payment routes require authentication
router.use(auth_middleware_js_1.authenticateToken);
// Process payment and add funds to wallet
router.post('/process', paymentController.processPayment);
// Get payment history for user
router.get('/history', paymentController.getPaymentHistory);
// Validate payment amount
router.post('/validate-amount', paymentController.validateAmount);
exports.default = router;
