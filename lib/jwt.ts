import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

/**
 * JWT payload interface
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Generate access token (15 minutes expiry)
 * @param payload - User payload
 * @returns JWT access token
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

/**
 * Generate refresh token (7 days expiry)
 * @param payload - User payload
 * @returns JWT refresh token
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

/**
 * Verify access token
 * @param token - JWT token
 * @returns Decoded payload or null if invalid
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Verify refresh token
 * @param token - JWT token
 * @returns Decoded payload or null if invalid
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Generate email verification token (24 hours expiry)
 * @param userId - User ID
 * @returns Signed token
 */
export function generateEmailVerificationToken(userId: string): string {
  return jwt.sign({ userId, type: 'email_verification' }, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Verify email verification token
 * @param token - Token to verify
 * @returns User ID or null if invalid
 */
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

/**
 * Generate password reset token (1 hour expiry)
 * @param userId - User ID
 * @returns Signed token
 */
export function generatePasswordResetToken(userId: string): string {
  return jwt.sign({ userId, type: 'password_reset' }, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Verify password reset token
 * @param token - Token to verify
 * @returns User ID or null if invalid
 */
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