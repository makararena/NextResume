'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import TestControls from './TestControls';

export default function DevTools() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Only show in development or if explicitly enabled
  if (process.env.NODE_ENV !== 'development' && !process.env.ENABLE_TEST_FEATURES) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30">
        <CardHeader className="py-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-bold text-yellow-800 dark:text-yellow-400">
              Developer Testing Tools
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronUpIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
          <CardDescription className="text-xs text-yellow-700 dark:text-yellow-500">
            Tools for testing features without API calls
          </CardDescription>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="p-0">
            <TestControls />
          </CardContent>
        )}
      </Card>
    </div>
  );
} 