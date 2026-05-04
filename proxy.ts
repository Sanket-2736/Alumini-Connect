import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';

const protectedRoutes = [
  '/dashboard',
  '/api/user',
  '/api/admin',
  '/api/chat',
  '/api/connections',
  '/api/search',
  '/api/notifications',
];

const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/api/auth',
  '/api/admin/auth/login', // Admin login endpoint (public)
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log(`\n🔍 [MIDDLEWARE] Processing request: ${request.method} ${pathname}`);

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  console.log(`  - Protected: ${isProtectedRoute}, Public: ${isPublicRoute}`);

  if (!isProtectedRoute || isPublicRoute) {
    console.log(`  ✅ Route is public/unprotected, skipping token check`);
    return NextResponse.next();
  }

  // Try to get token from Authorization header first
  let authHeader = request.headers.get('authorization');
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
    console.log(`  - Token from Authorization header`);
  } else {
    // If no Authorization header, try to get refresh token from cookies
    const refreshToken = request.cookies.get('refreshToken')?.value;
    if (refreshToken) {
      token = refreshToken;
      console.log(`  - Token from refresh token cookie`);
    }
  }

  console.log(`  - Auth header present: ${!!authHeader}, Token present: ${!!token}`);

  if (!token) {
    console.log(`  ❌ Missing authorization header and refresh token`);
    return NextResponse.json(
      { success: false, message: 'Access token required' },
      { status: 401 }
    );
  }

  // Try to verify as access token first
  let payload = verifyAccessToken(token);

  // If access token is invalid, try refresh token
  if (!payload) {
    payload = verifyRefreshToken(token);
    if (payload) {
      console.log(`  - Access token invalid, but refresh token valid`);
    }
  }

  console.log(`  - Token verified: ${!!payload}`);

  if (!payload) {
    console.log(`  ❌ Invalid or expired token`);
    return NextResponse.json(
      { success: false, message: 'Invalid or expired access token' },
      { status: 401 }
    );
  }

  console.log(`  - Payload: email=${payload.email}, role=${payload.role}`);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);

  if (pathname.startsWith('/api/admin') && !['admin', 'moderator'].includes(payload.role)) {
    console.log(`  ❌ User role ${payload.role} is not admin/moderator`);
    return NextResponse.json(
      { success: false, message: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  console.log(`  ✅ Request authorized, proceeding`);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};
