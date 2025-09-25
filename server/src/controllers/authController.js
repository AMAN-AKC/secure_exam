import { User } from '../models/User.js';
import { hashPassword, signToken } from '../middlewares/auth.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    const passwordHash = await hashPassword(password);
    
    const user = await User.create({ name, email, passwordHash, role });
    
    const token = signToken(user);
    res.json({ 
      message: 'Registration successful',
      token, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (e) {
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
    
    const token = signToken(user);
    
    res.json({ 
      token, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (e) {
    res.status(500).json({ error: 'Login failed' });
  }
};
