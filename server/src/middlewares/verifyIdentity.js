import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { logAuditEvent } from '../utils/auditLog.js';

/**
 * Middleware to re-verify user identity for sensitive operations
 * Requires either password or OTP verification
 * 
 * Usage:
 *   router.post('/sensitive-op', verifyIdentity, sensitiveOpController);
 * 
 * Client must send in body:
 *   { identityToken: "jwt_token_from_verify_endpoint" }
 * 
 * Or use verifyIdentityChallenge to issue the challenge first
 */

/**
 * Store for identity verification tokens (password/OTP confirmed)
 * In production, use Redis instead of in-memory
 */
const verificationTokens = new Map();

/**
 * Cleanup old tokens every 5 minutes
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of verificationTokens.entries()) {
    if (data.expiresAt < now) {
      verificationTokens.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Endpoint to challenge user for identity verification
 * Returns what method (password/OTP) is required
 */
export const verifyIdentityChallenge = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate challenge
    const challenge = {
      userId: req.user.id,
      type: user.mfaRequired ? 'otp' : 'password',
      message: user.mfaRequired 
        ? 'Enter the OTP sent to your phone' 
        : 'Enter your password to confirm this action',
      timestamp: new Date(),
      expiresIn: 5 * 60 // 5 minutes
    };

    res.json({
      success: true,
      challenge,
      note: 'After verification, you will receive an identityToken valid for 15 minutes'
    });
  } catch (error) {
    console.error('Error in verifyIdentityChallenge:', error);
    res.status(500).json({ error: 'Failed to issue challenge', details: error.message });
  }
};

/**
 * Endpoint to verify password and issue identity token
 */
export const verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      // Log failed verification attempt
      await logAuditEvent(
        req,
        req.user.id,
        'identity_verification_failed',
        'User',
        req.user.id,
        null,
        'Failed password verification for sensitive operation',
        'failed'
      ).catch(err => console.error('Audit log error:', err));

      return res.status(401).json({ 
        error: 'Invalid password',
        message: 'Password verification failed' 
      });
    }

    // Generate identity token
    const tokenId = `verify_${req.user.id}_${Date.now()}`;
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    verificationTokens.set(tokenId, {
      userId: req.user.id,
      type: 'password',
      expiresAt,
      verified: true
    });

    // Log successful verification
    await logAuditEvent(
      req,
      req.user.id,
      'identity_verified',
      'User',
      req.user.id,
      null,
      'Password verification for sensitive operation',
      'success'
    ).catch(err => console.error('Audit log error:', err));

    res.json({
      success: true,
      identityToken: tokenId,
      expiresIn: 15 * 60 // seconds
    });
  } catch (error) {
    console.error('Error in verifyPassword:', error);
    res.status(500).json({ error: 'Verification failed', details: error.message });
  }
};

/**
 * Endpoint to verify OTP and issue identity token
 */
export const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ error: 'OTP required' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if OTP exists and is not expired
    if (!user.mfaOtp || !user.mfaOtpExpiry) {
      return res.status(400).json({ 
        error: 'No OTP found',
        message: 'Request a new OTP first' 
      });
    }

    if (Date.now() > user.mfaOtpExpiry.getTime()) {
      return res.status(400).json({ 
        error: 'OTP expired',
        message: 'Request a new OTP' 
      });
    }

    // Verify OTP
    if (String(otp) !== String(user.mfaOtp)) {
      // Log failed verification attempt
      await logAuditEvent(
        req,
        req.user.id,
        'identity_verification_failed',
        'User',
        req.user.id,
        null,
        'Failed OTP verification for sensitive operation',
        'failed'
      ).catch(err => console.error('Audit log error:', err));

      return res.status(401).json({ 
        error: 'Invalid OTP',
        message: 'OTP verification failed' 
      });
    }

    // Clear OTP after use
    user.mfaOtp = null;
    user.mfaOtpExpiry = null;
    await user.save();

    // Generate identity token
    const tokenId = `verify_${req.user.id}_${Date.now()}`;
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    verificationTokens.set(tokenId, {
      userId: req.user.id,
      type: 'otp',
      expiresAt,
      verified: true
    });

    // Log successful verification
    await logAuditEvent(
      req,
      req.user.id,
      'identity_verified',
      'User',
      req.user.id,
      null,
      'OTP verification for sensitive operation',
      'success'
    ).catch(err => console.error('Audit log error:', err));

    res.json({
      success: true,
      identityToken: tokenId,
      expiresIn: 15 * 60 // seconds
    });
  } catch (error) {
    console.error('Error in verifyOTP:', error);
    res.status(500).json({ error: 'Verification failed', details: error.message });
  }
};

/**
 * Middleware to enforce identity verification for sensitive operations
 * Checks for valid identityToken in request body
 */
export const requireIdentityVerification = async (req, res, next) => {
  try {
    const { identityToken } = req.body;

    if (!identityToken) {
      // Log unauthorized attempt
      await logAuditEvent(
        req,
        req.user?.id,
        'security_alert',
        'SensitiveOperation',
        null,
        null,
        'Attempted sensitive operation without identity verification',
        'unauthorized'
      ).catch(err => console.error('Audit log error:', err));

      return res.status(401).json({
        error: 'Identity verification required',
        message: 'This operation requires identity verification. Call the verify endpoint first.',
        code: 'IDENTITY_VERIFICATION_REQUIRED'
      });
    }

    const verification = verificationTokens.get(identityToken);

    if (!verification) {
      return res.status(401).json({
        error: 'Invalid verification token',
        message: 'Verification token not found or expired'
      });
    }

    // Check expiry
    if (verification.expiresAt < Date.now()) {
      verificationTokens.delete(identityToken);
      return res.status(401).json({
        error: 'Verification token expired',
        message: 'Please verify your identity again'
      });
    }

    // Check userId matches
    if (String(verification.userId) !== String(req.user.id)) {
      return res.status(403).json({
        error: 'Verification token mismatch',
        message: 'Verification token belongs to a different user'
      });
    }

    // Verification successful - store for logging
    req.identityVerified = true;
    req.identityVerificationType = verification.type;

    // Consume token after use
    verificationTokens.delete(identityToken);

    next();
  } catch (error) {
    console.error('Error in requireIdentityVerification middleware:', error);
    res.status(500).json({ error: 'Verification check failed', details: error.message });
  }
};

/**
 * Clear all verification tokens for a user (e.g., on logout)
 */
export const clearUserVerifications = (userId) => {
  for (const [key, data] of verificationTokens.entries()) {
    if (data.userId === userId) {
      verificationTokens.delete(key);
    }
  }
};

/**
 * Get size of verification tokens store (for monitoring)
 */
export const getVerificationTokensStats = () => {
  return {
    activeTokens: verificationTokens.size,
    tokenIds: Array.from(verificationTokens.keys())
  };
};
