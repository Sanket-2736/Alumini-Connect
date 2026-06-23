import { NextResponse } from 'next/server';


export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}


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