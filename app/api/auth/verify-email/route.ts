import { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/apiResponse';

/**
 * GET /api/auth/verify-email?token=
 * Email verification endpoint - DEPRECATED
 * Email verification has been replaced with document upload verification
 */
export async function GET(request: NextRequest) {
  return errorResponse(
    'Email verification is no longer needed. Please complete account registration by uploading your verification documents.',
    410 // 410 Gone status code
  );
}