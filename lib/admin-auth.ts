/**
 * Admin authentication utilities
 * Uses environment variables for credentials
 */

export function verifyAdminToken(token: string): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@example.com';
    
    return decoded.email === adminEmail && decoded.role === 'admin';
  } catch {
    return false;
  }
}

export function getAdminCredentials() {
  return {
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@example.com',
    password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Admin@12345',
  };
}
