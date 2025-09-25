import { User } from '../models/User.js';
import { hashPassword } from '../middlewares/auth.js';

function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function seedAdminIfNeeded() {
  const existing = await User.findOne({ role: 'admin' });
  if (existing) return;

  const email = `admin${randomString(5)}@secureexam.com`;
  const password = randomString(12);
  const passwordHash = await hashPassword(password);

  const admin = await User.create({ name: 'Administrator', email, passwordHash, role: 'admin' });

  console.log('Admin seeded. Use these credentials to login:');
  console.log({ email: admin.email, password });
}
