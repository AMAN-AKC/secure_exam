import { User } from '../models/User.js';
import { hashPassword, signToken } from '../middlewares/auth.js';
import { OAuth2Client } from 'google-auth-library';
import twilio from 'twilio';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Lazy-initialize Twilio to ensure env vars are loaded
let twilioClient = null;
function getTwilioClient() {
  if (!twilioClient) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

// Helper function to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, verifiedPhoneUserId } = req.body;
    
    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // If phone was verified via OTP, use that user
    if (verifiedPhoneUserId) {
      const verifiedUser = await User.findById(verifiedPhoneUserId);
      
      if (!verifiedUser) {
        return res.status(404).json({ error: 'Verification failed, please try again' });
      }

      // Update the verified phone user with password and full details
      verifiedUser.name = name;
      verifiedUser.email = email;
      verifiedUser.passwordHash = await hashPassword(password);
      verifiedUser.role = role;
      verifiedUser.authMethod = 'password';
      verifiedUser.isPhoneVerified = true;
      await verifiedUser.save();

      const token = signToken(verifiedUser);
      return res.json({ 
        message: 'Registration successful',
        token, 
        user: { id: verifiedUser._id, name: verifiedUser.name, email: verifiedUser.email, role: verifiedUser.role, phone: verifiedUser.phone } 
      });
    }

    // Standard registration without phone verification (fallback)
    const passwordHash = await hashPassword(password);
    
    const user = await User.create({ 
      name, 
      email, 
      passwordHash, 
      role, 
      phone,
      authMethod: 'password',
      isPhoneVerified: true // Auto-verified
    });
    
    const token = signToken(user);
    res.json({ 
      message: 'Registration successful',
      token, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone } 
    });
  } catch (e) {
    console.error('Registration error:', e);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const ok = await user.verifyPassword(password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate OTP for MFA Step 2
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Save OTP to user
    user.mfaOtp = otp;
    user.mfaOtpExpiry = otpExpiry;
    await user.save();
    
    // Send OTP via SMS or console in demo mode
    if (user.demoMode || !process.env.TWILIO_ACCOUNT_SID) {
      console.log(`📱 OTP for ${email}: ${otp} (expires in 10 minutes)`);
    } else {
      try {
        const client = getTwilioClient();
        await client.messages.create({
          body: `Your Secure Exam OTP is: ${otp}. Valid for 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: user.phone || '+1234567890'
        });
      } catch (twilioError) {
        console.log(`📱 OTP (SMS failed): ${otp}`);
      }
    }
    
    // Create temporary MFA token (valid only for step 2)
    const mfaToken = signToken({ 
      id: user._id, 
      email: user.email, 
      mfaRequired: true 
    }, '10m');
    
    res.json({ 
      success: true,
      mfaToken,
      otpSentTo: user.phone || 'console',
      message: 'OTP sent. Complete step 2 to login.'
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Step 2: Verify OTP and complete login
export const verifyLoginMfa = async (req, res) => {
  try {
    const { mfaToken, otp } = req.body;
    const userId = req.user?.id;
    
    if (!mfaToken || !otp || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Check if OTP is valid
    if (!user.mfaOtp || user.mfaOtp !== otp.toString()) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }
    
    // Check if OTP expired
    if (new Date() > user.mfaOtpExpiry) {
      return res.status(401).json({ error: 'OTP expired' });
    }
    
    // Clear OTP
    user.mfaOtp = null;
    user.mfaOtpExpiry = null;
    user.lastLoginAt = new Date();
    await user.save();
    
    // Create full access token
    const token = signToken(user);
    
    res.json({ 
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      message: 'Login successful'
    });
  } catch (e) {
    console.error('MFA verification error:', e);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// Google OAuth Handler
export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture } = payload;
    
    let user = await User.findOne({ googleId });
    
    if (!user) {
      // Check if email exists
      const existingEmail = await User.findOne({ email });
      
      if (existingEmail) {
        // Link Google account to existing email
        existingEmail.googleId = googleId;
        existingEmail.isGoogleAuthenticated = true;
        existingEmail.authMethod = 'google';
        await existingEmail.save();
        user = existingEmail;
      } else {
        // Create new user with Google
        user = await User.create({
          name: name || email.split('@')[0],
          email,
          googleId,
          isGoogleAuthenticated: true,
          role: 'student', // Default role for Google signup
          authMethod: 'google'
        });
      }
    }
    
    const authToken = signToken(user);
    
    res.json({ 
      message: 'Google login successful',
      token: authToken, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ error: 'Google login failed' });
  }
};

// Phone SMS - Send Verification Code
export const sendPhoneVerification = async (req, res) => {
  try {
    const { phone, role } = req.body;
    
    if (!phone || !role) {
      return res.status(400).json({ error: 'Phone and role required' });
    }
    
    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const otp = generateOTP();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Check if user exists with this phone
    let user = await User.findOne({ phone });
    
    if (!user) {
      // Create user with unverified phone (generate temp email)
      const tempEmail = `phone_${Date.now()}@temp.local`;
      user = await User.create({
        email: tempEmail,
        phone,
        role,
        verificationCode: otp,
        verificationCodeExpiry: expiryTime,
        authMethod: 'phone',
        isPhoneVerified: false
      });
    } else {
      // Update existing user
      user.verificationCode = otp;
      user.verificationCodeExpiry = expiryTime;
      await user.save();
    }
    
    // Send SMS via Twilio
    try {
      console.log('Twilio config check:');
      console.log('- Account SID:', process.env.TWILIO_ACCOUNT_SID ? '✓ Set' : '✗ Not set');
      console.log('- Auth Token:', process.env.TWILIO_AUTH_TOKEN ? '✓ Set' : '✗ Not set');
      console.log('- Phone Number:', process.env.TWILIO_PHONE_NUMBER);
      
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'YOUR_TWILIO_ACCOUNT_SID') {
        console.log(`Attempting to send SMS to ${phone}...`);
        const client = getTwilioClient();
        await client.messages.create({
          body: `Your verification code is: ${otp}. Valid for 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone
        });
        console.log(`✅ SMS sent successfully to ${phone}`);
      } else {
        // Demo mode - log OTP to console instead
        console.log(`\n🔐 DEMO MODE - Verification Code for ${phone}: ${otp}\n`);
      }
    } catch (smsError) {
      console.error('❌ SMS send error:', smsError.message);
      console.error('Full error:', smsError);
      // Don't fail - just log it
      console.log(`\n🔐 DEMO MODE - Verification Code for ${phone}: ${otp}\n`);
    }
    
    res.json({ 
      message: 'Verification code sent',
      userId: user._id,
      expiresIn: '10 minutes'
    });
  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
};

// Phone SMS - Verify Code and Complete Registration
export const verifyPhoneCode = async (req, res) => {
  try {
    const { userId, verificationCode, name, email } = req.body;
    
    if (!userId || !verificationCode) {
      return res.status(400).json({ error: 'User ID and verification code required' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if code is expired
    if (new Date() > user.verificationCodeExpiry) {
      return res.status(400).json({ error: 'Verification code expired' });
    }
    
    // Check if code matches
    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    // Update user
    user.isPhoneVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpiry = null;
    
    // Set email and name if provided
    if (email) user.email = email;
    if (name) user.name = name;
    
    await user.save();
    
    const token = signToken(user);
    
    res.json({
      message: 'Phone verification successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone }
    });
  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// Resend Verification Code
export const resendVerificationCode = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const otp = generateOTP();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
    
    user.verificationCode = otp;
    user.verificationCodeExpiry = expiryTime;
    await user.save();
    
    try {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'YOUR_TWILIO_ACCOUNT_SID') {
        await twilioClient.messages.create({
          body: `Your new verification code is: ${otp}. Valid for 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: user.phone
        });
        console.log(`SMS resent to ${user.phone}`);
      } else {
        // Demo mode - log OTP to console instead
        console.log(`\n🔐 DEMO MODE - New Verification Code for ${user.phone}: ${otp}\n`);
      }
    } catch (smsError) {
      console.error('SMS send error:', smsError);
      // Don't fail - just log it
      console.log(`\n🔐 DEMO MODE - New Verification Code for ${user.phone}: ${otp}\n`);
    }
    
    res.json({ 
      message: 'Verification code resent',
      expiresIn: '10 minutes'
    });
  } catch (error) {
    console.error('Resend error:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
};

