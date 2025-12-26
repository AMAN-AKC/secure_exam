import { Router } from 'express';
import { login, register, googleLogin, sendPhoneVerification, verifyPhoneCode, resendVerificationCode, verifyLoginMfa } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();
router.post('/register', register); // for student/teacher
router.post('/login', login); // Step 1: Email + Password
router.post('/login/verify-mfa', authMiddleware(), verifyLoginMfa); // Step 2: OTP verification
router.post('/google-login', googleLogin);
router.post('/phone/send-code', sendPhoneVerification);
router.post('/phone/verify-code', verifyPhoneCode);
router.post('/phone/resend-code', resendVerificationCode);

export default router;
