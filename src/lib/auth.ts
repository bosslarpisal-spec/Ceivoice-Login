import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

/* ===============================
   Password Hash
================================ */

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/* ===============================
   Password Compare
================================ */

export async function verifyPassword(
  password: string,
  hashedPassword: string
) {
  return bcrypt.compare(password, hashedPassword);
}

/* ===============================
   JWT Sign
================================ */

export function signJWT(payload: any) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
}

/* ===============================
   JWT Verify
================================ */

export function verifyJWT(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}