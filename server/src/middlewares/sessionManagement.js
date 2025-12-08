import { LoginSession } from '../models/LoginSession.js';
import crypto from 'crypto';
import { AuditLog } from '../models/AuditLog.js';

/**
 * Create a new login session
 * Called after successful authentication
 */
export async function createLoginSession(userId, userAgent, ipAddress, deviceName = 'Unknown Device') {
  try {
    // Generate unique session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    // Create session (480 min = 8 hours default)
    const session = await LoginSession.createSession(
      userId,
      sessionToken,
      userAgent,
      ipAddress,
      deviceName,
      480
    );
    
    return sessionToken;
  } catch (error) {
    console.error('Error creating login session:', error);
    throw error;
  }
}

/**
 * Validate session token and update activity
 * Called on protected endpoints
 */
export async function validateSessionToken(sessionToken) {
  try {
    const session = await LoginSession.updateActivity(sessionToken);
    if (!session) {
      throw new Error('Invalid or expired session');
    }
    return session;
  } catch (error) {
    console.error('Error validating session token:', error);
    throw error;
  }
}

/**
 * Revoke a specific session
 * Called on logout
 */
export async function revokeSession(sessionToken, reason = 'user_logout', revokedBy = null) {
  try {
    const session = await LoginSession.revokeSession(sessionToken, reason, revokedBy);
    
    if (session && revokedBy) {
      await AuditLog.logAction({
        userId: revokedBy,
        action: 'session_revoked',
        resource: 'login_session',
        resourceId: session._id,
        resourceTitle: `Session: ${session.deviceName} (${session.ipAddress})`,
        metadata: {
          targetUserId: session.userId,
          reason,
          sessionCreatedAt: session.createdAt,
          sessionLastActive: session.lastActivityAt
        }
      });
    }
    
    return session;
  } catch (error) {
    console.error('Error revoking session:', error);
    throw error;
  }
}

/**
 * Endpoint: Get all active sessions for current user
 * GET /api/auth/sessions
 */
export async function getActiveSessions(req, res) {
  try {
    const userId = req.user.id;
    const sessions = await LoginSession.getActiveSessions(userId);
    
    const formattedSessions = sessions.map(session => ({
      sessionId: session._id,
      deviceName: session.deviceName,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      requestCount: session.requestCount,
      isCurrent: req.sessionToken === session.sessionToken
    }));
    
    res.json({
      success: true,
      activeSessions: formattedSessions,
      count: formattedSessions.length
    });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
  }
}

/**
 * Endpoint: Get session history (all sessions)
 * GET /api/auth/sessions/history
 */
export async function getSessionHistory(req, res) {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    
    const sessions = await LoginSession.getSessionHistory(userId, limit);
    
    const formattedSessions = sessions.map(session => ({
      sessionId: session._id,
      deviceName: session.deviceName,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
      logoutReason: session.logoutReason,
      revokedAt: session.revokedAt,
      requestCount: session.requestCount,
      isCurrent: req.sessionToken === session.sessionToken
    }));
    
    res.json({
      success: true,
      sessions: formattedSessions,
      count: formattedSessions.length
    });
  } catch (error) {
    console.error('Error fetching session history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch session history' });
  }
}

/**
 * Endpoint: Logout specific session
 * POST /api/auth/sessions/:sessionId/logout
 */
export async function logoutSession(req, res) {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    // Verify session belongs to user
    const session = await LoginSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    
    // Revoke the session
    await session.updateOne({
      isActive: false,
      logoutReason: 'user_logout',
      revokedAt: new Date()
    });
    
    // Log the action
    await AuditLog.logAction({
      userId,
      action: 'session_logout',
      resource: 'login_session',
      resourceId: session._id,
      resourceTitle: `Session: ${session.deviceName} (${session.ipAddress})`,
      metadata: {
        deviceName: session.deviceName,
        ipAddress: session.ipAddress,
        sessionDuration: session.lastActivityAt - session.createdAt
      }
    });
    
    res.json({
      success: true,
      message: 'Session logged out successfully'
    });
  } catch (error) {
    console.error('Error logging out session:', error);
    res.status(500).json({ success: false, message: 'Failed to logout session' });
  }
}

/**
 * Endpoint: Logout all other sessions (security feature)
 * POST /api/auth/sessions/logout-all-others
 */
export async function logoutAllOtherSessions(req, res) {
  try {
    const userId = req.user.id;
    const currentSessionToken = req.sessionToken;
    
    const sessions = await LoginSession.find({ userId, isActive: true });
    let revokedCount = 0;
    
    for (const session of sessions) {
      if (session.sessionToken !== currentSessionToken) {
        await session.updateOne({
          isActive: false,
          logoutReason: 'user_logout',
          revokedAt: new Date()
        });
        revokedCount++;
      }
    }
    
    // Log the action
    await AuditLog.logAction({
      userId,
      action: 'logout_all_sessions',
      resource: 'login_session',
      resourceId: null,
      resourceTitle: 'Logout all other sessions',
      metadata: {
        revokedCount,
        currentSessionPreserved: true
      }
    });
    
    res.json({
      success: true,
      message: `Logged out ${revokedCount} other session(s)`,
      revokedCount
    });
  } catch (error) {
    console.error('Error logging out all sessions:', error);
    res.status(500).json({ success: false, message: 'Failed to logout sessions' });
  }
}

/**
 * Admin Endpoint: View sessions for a specific user
 * GET /api/admin/users/:userId/sessions
 */
export async function getAdminViewUserSessions(req, res) {
  try {
    const { userId } = req.params;
    
    const sessions = await LoginSession.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    
    const formattedSessions = sessions.map(session => ({
      sessionId: session._id,
      deviceName: session.deviceName,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
      logoutReason: session.logoutReason,
      requestCount: session.requestCount
    }));
    
    res.json({
      success: true,
      userId,
      sessions: formattedSessions,
      count: formattedSessions.length,
      activeSessions: formattedSessions.filter(s => s.isActive).length
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user sessions' });
  }
}

/**
 * Admin Endpoint: Revoke a session
 * POST /api/admin/sessions/:sessionId/revoke
 */
export async function revokeUserSession(req, res) {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;
    
    const session = await LoginSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    
    const targetUserId = session.userId;
    
    // Revoke the session
    await session.updateOne({
      isActive: false,
      logoutReason: 'security_revoked',
      revokedAt: new Date(),
      revokedBy: adminId
    });
    
    // Log the action
    await AuditLog.logAction({
      userId: adminId,
      action: 'admin_session_revoke',
      resource: 'login_session',
      resourceId: session._id,
      resourceTitle: `Session: ${session.deviceName} (${session.ipAddress}) - User: ${targetUserId}`,
      metadata: {
        targetUserId,
        reason: reason || 'Administrative action',
        deviceName: session.deviceName,
        ipAddress: session.ipAddress
      }
    });
    
    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking user session:', error);
    res.status(500).json({ success: false, message: 'Failed to revoke session' });
  }
}

/**
 * Admin Endpoint: Revoke all sessions for a user
 * POST /api/admin/users/:userId/sessions/revoke-all
 */
export async function revokeAllUserSessionsAdmin(req, res) {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;
    
    const sessions = await LoginSession.find({ userId, isActive: true });
    let revokedCount = 0;
    
    for (const session of sessions) {
      await session.updateOne({
        isActive: false,
        logoutReason: 'security_revoked',
        revokedAt: new Date(),
        revokedBy: adminId
      });
      revokedCount++;
    }
    
    // Log the action
    await AuditLog.logAction({
      userId: adminId,
      action: 'admin_revoke_all_sessions',
      resource: 'login_session',
      resourceId: null,
      resourceTitle: `Revoke all sessions for user: ${userId}`,
      metadata: {
        targetUserId: userId,
        revokedCount,
        reason: reason || 'Administrative action'
      }
    });
    
    res.json({
      success: true,
      message: `Revoked ${revokedCount} session(s)`,
      revokedCount
    });
  } catch (error) {
    console.error('Error revoking all user sessions:', error);
    res.status(500).json({ success: false, message: 'Failed to revoke sessions' });
  }
}

/**
 * Utility: Cleanup expired sessions (run periodically)
 * Can be scheduled with a cron job
 */
export async function cleanupExpiredSessions() {
  try {
    const cleanedCount = await LoginSession.cleanupExpiredSessions();
    console.log(`Cleaned up ${cleanedCount} expired sessions`);
    return cleanedCount;
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
    throw error;
  }
}
