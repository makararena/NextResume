/**
 * 404 Not Found Page for Auth Routes
 * 
 * This component is displayed when a user navigates to a non-existent authentication route.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { KeyRound } from 'lucide-react';

export default function AuthNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md mx-auto rounded-lg border border-border shadow-lg p-8 text-center bg-card">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-yellow-100 p-3">
            <KeyRound className="h-10 w-10 text-yellow-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Authentication Page Not Found</h1>
        
        <p className="text-muted-foreground mb-8">
          Sorry, we couldn&apos;t find the authentication page you were looking for.
          Please try signing in or signing up using the links below.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            variant="outline" 
            asChild
          >
            <Link href="/sign-in">
              Sign In
            </Link>
          </Button>
          
          <Button 
            asChild
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            <Link href="/sign-up">
              Sign Up
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 