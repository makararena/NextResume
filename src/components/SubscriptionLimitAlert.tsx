"use client";

import React from 'react';
import { AlertCircle, CreditCard } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { FREE_TIER_LIMITS } from '@/lib/subscription';

type LimitType = 'resume' | 'ai';

interface SubscriptionLimitAlertProps {
  type: LimitType;
  className?: string;
}

export function SubscriptionLimitAlert({ type, className = '' }: SubscriptionLimitAlertProps) {
  const router = useRouter();
  
  const messages = {
    resume: {
      title: "Resume Limit Reached",
      description: `You've reached ${FREE_TIER_LIMITS.MAX_RESUMES} resume limit. Upgrade to Premium for unlimited resumes.`
    },
    ai: {
      title: "AI Generation Limit Reached",
      description: `You've reached ${FREE_TIER_LIMITS.MAX_AI_GENERATIONS} AI generation limit. Upgrade to Premium for unlimited AI features.`
    }
  };
  
  return (
    <Alert variant="destructive" className={`${className} flex justify-between items-start`}>
      <div>
        <AlertTitle className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {messages[type].title}
        </AlertTitle>
        <AlertDescription className="mt-2">
          {messages[type].description}
        </AlertDescription>
      </div>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-1.5 whitespace-nowrap ml-2 mt-0.5"
      >
        <CreditCard className="h-3.5 w-3.5" />
        Upgrade to Premium
      </Button>
    </Alert>
  );
} 