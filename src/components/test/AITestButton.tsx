'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BugAntIcon } from '@heroicons/react/24/outline';

export default function AITestButton() {
  const [isLoading, setIsLoading] = useState(false);
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development' && !process.env.ENABLE_TEST_FEATURES) {
    return null;
  }

  const handleTestAICount = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test/increment-ai-generation', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to increment AI generation count');
      }
      
      toast.success('AI generation count incremented for testing');
    } catch (error) {
      console.error('Test increment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to increment AI count');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleTestAICount}
      disabled={isLoading}
      className="bg-yellow-600 hover:bg-yellow-700 text-white border border-yellow-800 flex items-center gap-2"
      size="sm"
    >
      <BugAntIcon className="w-4 h-4" />
      {isLoading ? 'Testing...' : 'Test AI Generation Count'}
    </Button>
  );
} 