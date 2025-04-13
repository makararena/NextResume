import { NextRequest, NextResponse } from 'next/server';

// Simple error middleware for route handlers
export function withErrorHandling(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error) {
      console.error('API error:', error);
      
      // Simple error response
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
        { status: 500 }
      );
    }
  };
}

// Function to safely parse JSON with error handling
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('JSON parsing error:', error);
    return fallback;
  }
}

// Function to create error responses
export function createErrorResponse(message: string, statusCode: number = 500) {
  return NextResponse.json(
    {
      error: message,
    },
    { status: statusCode }
  );
} 