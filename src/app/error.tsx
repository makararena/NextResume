'use client';

/**
 * Global Error Component
 * 
 * This is a Next.js Error Boundary component that captures and handles runtime errors
 * in the application's UI. It provides a user-friendly error message and recovery options.
 * 
 * For more information on Next.js Error Handling:
 * https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { monitoring } from '@/lib/monitoring';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Report the error to our monitoring system
  useEffect(() => {
    monitoring.captureError('Global UI Error', error, {
      digest: error.digest,
      location: 'Global Error Boundary',
    }, 'high');
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md mx-auto rounded-lg border border-border shadow-lg p-8 text-center bg-card">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-orange-100 p-3">
            <AlertTriangle className="h-10 w-10 text-orange-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        
        <p className="text-muted-foreground mb-8">
          We're sorry, but we couldn't complete your request. Our team has been notified and is working to fix the issue.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            Go to home page
          </Button>
          
          <Button 
            onClick={() => reset()}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            Try again
          </Button>
        </div>
        
        {error.digest && (
          <p className="mt-8 text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
} 