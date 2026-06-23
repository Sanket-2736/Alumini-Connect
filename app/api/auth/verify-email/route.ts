import { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/apiResponse';


export async function GET(request: NextRequest) {
  return errorResponse(
    'Email verification is no longer needed. Please complete account registration by uploading your verification documents.',
    410 // 410 Gone status code
  );
}