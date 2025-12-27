import { Router } from 'express';
import { login, register, googleLogin, sendPhoneVerification, verifyPhoneCode, resendVerificationCode, verifyLoginMfa } from '../controllers/authController.js';

const router = Router();
router.post('/register', register); // for student/teacher
router.post('/login', login);
router.post('/login/verify-mfa', verifyLoginMfa); // Step 2: MFA verification
router.post('/google-login', googleLogin);
router.post('/phone/send-code', sendPhoneVerification);
router.post('/phone/verify-code', verifyPhoneCode);
router.post('/phone/resend-code', resendVerificationCode);

export default router;
