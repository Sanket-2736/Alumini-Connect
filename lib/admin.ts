import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from './apiResponse';

/**
 * Check if user has admin role
 */
export function requireAdmin(request: NextRequest): NextResponse | null {
  const userRole = request.headers.get('x-user-role');

  if (!userRole || userRole !== 'admin') {
    return errorResponse('Admin access required', 403);
  }

  return null; // No error, proceed
}

/**
 * Check if user has admin or moderator role
 */
export function requireModerator(request: NextRequest): NextResponse | null {
  const userRole = request.headers.get('x-user-role');

  if (!userRole || !['admin', 'moderator'].includes(userRole)) {
    return errorResponse('Moderator access required', 403);
  }

  return null; // No error, proceed
}