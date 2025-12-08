import { Router } from 'express';
import { login, verifyLoginMfa, register, googleLogin, sendPhoneVerification, verifyPhoneCode, resendVerificationCode } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/auth.js';
import { loginRateLimit, registerRateLimit, otpSendRateLimit, otpVerifyRateLimit } from '../middlewares/rateLimit.js';
import { verifyIdentityChallenge, verifyPassword, verifyOTP } from '../middlewares/verifyIdentity.js';
import { getActiveSessions, getSessionHistory, logoutSession, logoutAllOtherSessions } from '../middlewares/sessionManagement.js';

const router = Router();

// Apply rate limiting to auth endpoints
router.post('/register', registerRateLimit, register); // 3 per hour
router.post('/login', loginRateLimit, login); // 5 per 15 minutes
router.post('/login/verify-mfa', otpVerifyRateLimit, verifyLoginMfa); // 10 per 30 minutes
router.post('/google-login', loginRateLimit, googleLogin); // 5 per 15 minutes
router.post('/phone/send-code', otpSendRateLimit, sendPhoneVerification); // 5 per 30 minutes
router.post('/phone/verify-code', otpVerifyRateLimit, verifyPhoneCode); // 10 per 30 minutes
router.post('/phone/resend-code', otpVerifyRateLimit, resendVerificationCode); // 10 per 30 minutes

// ===== IDENTITY VERIFICATION FOR SENSITIVE OPERATIONS =====
// These endpoints require authentication first
router.get('/verify-identity/challenge', authMiddleware(), verifyIdentityChallenge); // Get challenge (what to verify: password or OTP)
router.post('/verify-identity/password', authMiddleware(), otpVerifyRateLimit, verifyPassword); // Verify password
router.post('/verify-identity/otp', authMiddleware(), otpVerifyRateLimit, verifyOTP); // Verify OTP

// ===== SESSION MANAGEMENT =====
// View and manage active sessions
router.get('/sessions', authMiddleware(), getActiveSessions); // Get all active sessions
router.get('/sessions/history', authMiddleware(), getSessionHistory); // Get session history
router.post('/sessions/:sessionId/logout', authMiddleware(), logoutSession); // Logout specific session
router.post('/sessions/logout-all-others', authMiddleware(), logoutAllOtherSessions); // Logout all other sessions (security feature)

export default router;
