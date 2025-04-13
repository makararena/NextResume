/**
 * 404 Not Found Page
 * 
 * This component is displayed when a user navigates to a route that doesn't exist.
 * It provides a user-friendly error message and navigation back to a known page.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md mx-auto rounded-lg border border-border shadow-lg p-8 text-center bg-card">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-blue-100 p-3">
            <FileQuestion className="h-10 w-10 text-blue-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        
        <p className="text-muted-foreground mb-8">
          Sorry, we couldn't find the page you're looking for. 
          It might have been moved, deleted, or never existed.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            variant="outline" 
            asChild
          >
            <Link href="/resumes">
              View my resumes
            </Link>
          </Button>
          
          <Button 
            asChild
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            <Link href="/">
              Go to home page
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 