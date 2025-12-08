import mongoose from 'mongoose';

const loginSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Session identification
  sessionToken: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  // Device/Browser information
  userAgent: {
    type: String,
    default: null
  },
  
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  
  deviceName: {
    type: String,
    default: 'Unknown Device'
  },
  
  // Session timeline
  createdAt: {
    type: Date,
    default: () => new Date(),
    index: true
  },
  
  lastActivityAt: {
    type: Date,
    default: () => new Date(),
    index: true
  },
  
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  
  // Session status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  logoutReason: {
    type: String,
    enum: ['user_logout', 'session_expired', 'security_revoked', 'device_logout', 'admin_action'],
    default: null
  },
  
  revokedAt: {
    type: Date,
    default: null
  },
  
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Activity metrics
  requestCount: {
    type: Number,
    default: 0
  },
  
  suspiciousActivities: [
    {
      type: String,
      enum: ['multiple_failed_attempts', 'unusual_ip', 'concurrent_sessions', 'rapid_requests']
    }
  ],
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

// Indexes for efficient querying
loginSessionSchema.index({ userId: 1, isActive: 1, createdAt: -1 });
loginSessionSchema.index({ userId: 1, expiresAt: 1 });
loginSessionSchema.index({ ipAddress: 1, createdAt: -1 });
loginSessionSchema.index({ lastActivityAt: 1 });

// Query helpers
loginSessionSchema.query.active = function () {
  return this.find({ isActive: true, expiresAt: { $gt: new Date() } });
};

loginSessionSchema.query.forUser = function (userId) {
  return this.find({ userId });
};

loginSessionSchema.query.expiredSessions = function () {
  return this.find({ expiresAt: { $lte: new Date() } });
};

// Static methods
loginSessionSchema.statics.createSession = async function (userId, sessionToken, userAgent, ipAddress, deviceName, expirationMinutes = 480) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expirationMinutes * 60000);
  
  const session = new this({
    userId,
    sessionToken,
    userAgent,
    ipAddress,
    deviceName,
    expiresAt,
    createdAt: now,
    lastActivityAt: now,
    isActive: true
  });
  
  await session.save();
  return session;
};

loginSessionSchema.statics.updateActivity = async function (sessionToken) {
  const session = await this.findOne({ sessionToken, isActive: true });
  if (session && session.expiresAt > new Date()) {
    session.lastActivityAt = new Date();
    session.requestCount += 1;
    await session.save();
    return session;
  }
  return null;
};

loginSessionSchema.statics.revokeSession = async function (sessionToken, reason = 'user_logout', revokedBy = null) {
  const session = await this.findOne({ sessionToken });
  if (session) {
    session.isActive = false;
    session.logoutReason = reason;
    session.revokedAt = new Date();
    if (revokedBy) session.revokedBy = revokedBy;
    await session.save();
    return session;
  }
  return null;
};

loginSessionSchema.statics.revokeAllUserSessions = async function (userId, reason = 'security_revoked', revokedBy = null, excludeSessionToken = null) {
  const sessions = await this.find({ userId, isActive: true });
  const revokedCount = 0;
  
  for (const session of sessions) {
    if (excludeSessionToken && session.sessionToken === excludeSessionToken) {
      continue; // Don't revoke the current session
    }
    session.isActive = false;
    session.logoutReason = reason;
    session.revokedAt = new Date();
    if (revokedBy) session.revokedBy = revokedBy;
    await session.save();
    revokedCount++;
  }
  
  return revokedCount;
};

loginSessionSchema.statics.cleanupExpiredSessions = async function () {
  const result = await this.updateMany(
    { expiresAt: { $lte: new Date() }, isActive: true },
    { $set: { isActive: false, logoutReason: 'session_expired', revokedAt: new Date() } }
  );
  return result.modifiedCount;
};

loginSessionSchema.statics.getActiveSessions = async function (userId) {
  return this.find({ userId, isActive: true, expiresAt: { $gt: new Date() } })
    .sort({ lastActivityAt: -1 })
    .lean();
};

loginSessionSchema.statics.getSessionHistory = async function (userId, limit = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

export const LoginSession = mongoose.model('LoginSession', loginSessionSchema);
