import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;


export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}


export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}


export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}


export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    console.log('  [JWT] Verifying access token...');
    console.log('  [JWT] JWT_SECRET exists:', !!process.env.JWT_SECRET);
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    console.log('  [JWT] ✅ Token verified:', { userId: decoded.userId, email: decoded.email, role: decoded.role });
    return decoded;
  } catch (error: any) {
    console.error('  [JWT] ❌ Token verification failed:', error.message);
    return null;
  }
}


export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}


export function generateEmailVerificationToken(userId: string): string {
  return jwt.sign({ userId, type: 'email_verification' }, JWT_SECRET, { expiresIn: '24h' });
}


export function verifyEmailVerificationToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload.type === 'email_verification') {
      return payload.userId;
    }
    return null;
  } catch {
    return null;
  }
}


export function generatePasswordResetToken(userId: string): string {
  return jwt.sign({ userId, type: 'password_reset' }, JWT_SECRET, { expiresIn: '1h' });
}


export function verifyPasswordResetToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload.type === 'password_reset') {
      return payload.userId;
    }
    return null;
  } catch {
    return null;
  }
}