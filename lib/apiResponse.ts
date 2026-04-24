import { NextResponse } from 'next/server';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Create a success response
 * @param data - The data to return
 * @param message - Optional success message
 * @param status - HTTP status code (default: 200)
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

/**
 * Create an error response
 * @param message - Error message
 * @param status - HTTP status code (default: 400)
 * @param data - Optional additional data
 */
export function errorResponse(
  message: string,
  status: number = 400,
  data?: any
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      message,
      data,
    },
    { status }
  );
}

/**
 * Create a server error response
 * @param message - Error message (default: 'Internal server error')
 * @param status - HTTP status code (default: 500)
 */
export function serverErrorResponse(
  message: string = 'Internal server error',
  status: number = 500
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}