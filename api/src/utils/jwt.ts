import jwt from 'jsonwebtoken';
import type { UserRole } from '../../../shared/types.js';

const SECRET = process.env.JWT_SECRET || 'warmnest-dev-secret-change-in-production';
const EXPIRES_IN = '7d';

export interface JwtPayload {
  userId: number;
  username: string;
  role: UserRole;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
