import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

export function authMiddleware(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return required ? res.status(401).json({ error: 'Unauthorized' }) : next();
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export function signToken(userOrPayload, expiresIn = '7d') {
  // Handle both User objects and custom payloads
  let payload;
  
  if (userOrPayload._id) {
    // It's a User object
    payload = { 
      id: userOrPayload._id, 
      role: userOrPayload.role, 
      email: userOrPayload.email, 
      name: userOrPayload.name 
    };
  } else {
    // It's already a payload object
    payload = userOrPayload;
  }
  
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}
