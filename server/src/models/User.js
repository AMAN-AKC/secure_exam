import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, unique: true, sparse: true, lowercase: true, index: true },
    passwordHash: { type: String, sparse: true },
    role: { type: String, enum: ['admin', 'teacher', 'student'], required: true },
    phone: { type: String, unique: true, sparse: true },
    googleId: { type: String, unique: true, sparse: true },
    isPhoneVerified: { type: Boolean, default: false },
    isGoogleAuthenticated: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpiry: { type: Date },
    authMethod: { type: String, enum: ['password', 'google', 'phone'], default: 'password' },

    // ===== MFA FIELDS =====
    mfaRequired: { type: Boolean, default: false },
    mfaOtp: { type: String, default: null },
    mfaOtpExpiry: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    demoMode: { type: Boolean, default: false },  // If true, OTP shows in terminal instead of SMS
  },
  { timestamps: true }
);

UserSchema.methods.verifyPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.model('User', UserSchema);
