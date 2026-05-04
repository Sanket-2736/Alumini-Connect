import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from './jwt';
import { errorResponse } from './apiResponse';

/**
 * Check if user has admin role (using JWT verification)
 */
export function requireAdmin(request: NextRequest): NextResponse | null {
  console.log('\n[REQUIRE_ADMIN] Checking admin authorization...');
  
  const authHeader = request.headers.get('authorization');
  console.log('  - Authorization header:', authHeader ? authHeader.substring(0, 30) + '...' : 'MISSING');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ Missing authorization header');
    return errorResponse('Missing or invalid authorization header', 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  console.log('  - Token to verify:', token.substring(0, 30) + '...');
  
  try {
    // Verify JWT token
    const decoded = verifyAccessToken(token);
    console.log('  - Token decoded successfully:', !!decoded);
    
    if (!decoded) {
      console.error('❌ Token verification returned null');
      return errorResponse('Invalid or expired access token', 401);
    }

    console.log('  - Decoded payload:', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    // Use non-NEXT_PUBLIC_ version for server-side verification
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    console.log('  - Expected admin email:', adminEmail);
    
    console.log('🔍 Token verification:');
    console.log('  - Token email:', decoded.email);
    console.log('  - Expected email:', adminEmail);
    console.log('  - Token role:', decoded.role);
    console.log('  - Match:', decoded.email === adminEmail && decoded.role === 'admin');
    
    // Verify token contains correct email and role
    if (decoded.email !== adminEmail || decoded.role !== 'admin') {
      console.error('❌ Token credentials do not match admin credentials');
      console.error('  - Expected:', { email: adminEmail, role: 'admin' });
      console.error('  - Got:', { email: decoded.email, role: decoded.role });
      return errorResponse('Invalid or expired access token', 403);
    }

    console.log('✅ Admin token verified successfully');
    return null; // No error, proceed
  } catch (error) {
    console.error('❌ Token verification error:', error);
    return errorResponse('Invalid or expired access token', 401);
  }
}

/**
 * Check if user has admin or moderator role
 */
export function requireModerator(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse('Missing or invalid authorization header', 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    // Verify JWT token
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return errorResponse('Invalid or expired access token', 401);
    }

    // Use non-NEXT_PUBLIC_ version for server-side verification
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    
    // Verify token contains correct email and role
    if (decoded.email !== adminEmail || decoded.role !== 'admin') {
      return errorResponse('Invalid or expired access token', 403);
    }

    return null; // No error, proceed
  } catch (error) {
    console.error('Token verification error:', error);
    return errorResponse('Invalid or expired access token', 401);
  }
}