'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  BugAntIcon,
  IdentificationIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';

export default function TestControls() {
  const [aiTestLoading, setAiTestLoading] = useState(false);
  const [resumeTestLoading, setResumeTestLoading] = useState(false);
  const [userCountLoading, setUserCountLoading] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [usageData, setUsageData] = useState<{ resumeCount: number; aiGenerationCount: number }>({ 
    resumeCount: 0, 
    aiGenerationCount: 0 
  });
  const [subscriptionType, setSubscriptionType] = useState<string | null>(null);
  
  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);
  
  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/usage');
      
      if (!response.ok) {
        throw new Error('Failed to get user usage');
      }
      
      const data = await response.json();
      setUsageData(data);
      setSubscriptionType(data.plan || 'free');
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  
  const incrementAICount = async () => {
    setAiTestLoading(true);
    try {
      const response = await fetch('/api/test/increment-ai-generation', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to increment AI count');
      }
      
      toast.success('AI generation count incremented for testing');
      fetchUserData();
    } catch (error) {
      console.error('Test increment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to increment AI count');
    } finally {
      setAiTestLoading(false);
    }
  };
  
  const incrementResumeCount = async () => {
    setResumeTestLoading(true);
    try {
      const response = await fetch('/api/user/increment-resume', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to increment resume count');
      }
      
      toast.success('Resume count incremented for testing');
      fetchUserData();
    } catch (error) {
      console.error('Test increment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to increment resume count');
    } finally {
      setResumeTestLoading(false);
    }
  };
  
  const resetUserCounts = async () => {
    setUserCountLoading(true);
    try {
      const response = await fetch('/api/test/reset-user-counts', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reset user counts');
      }
      
      toast.success('User usage counts reset successfully');
      fetchUserData();
    } catch (error) {
      console.error('Test reset error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reset user counts');
    } finally {
      setUserCountLoading(false);
    }
  };
  
  const getUserUsage = async () => {
    try {
      await fetchUserData();
      toast.success(`Current Usage: ${usageData.resumeCount} resumes, ${usageData.aiGenerationCount} AI generations`);
    } catch (error) {
      console.error('Test usage error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get user usage');
    }
  };
  
  const updateSubscription = async (type: string) => {
    setSubscriptionLoading(true);
    try {
      const response = await fetch(`/api/test/subscription?type=${type}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to update subscription to ${type}`);
      }
      
      toast.success(`Subscription set to ${type}`);
      setSubscriptionType(type);
      fetchUserData();
    } catch (error) {
      console.error('Subscription test error:', error);
      toast.error(error instanceof Error ? error.message : `Failed to update subscription to ${type}`);
    } finally {
      setSubscriptionLoading(false);
    }
  };
  
  const setTestUsageValues = async (resumes: number, ai: number) => {
    setUserCountLoading(true);
    try {
      const response = await fetch(`/api/test/usage?resumes=${resumes}&ai=${ai}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to set test usage values');
      }
      
      toast.success(`Test usage values set: ${resumes} resumes, ${ai} AI generations`);
      fetchUserData();
    } catch (error) {
      console.error('Test usage set error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to set test usage values');
    } finally {
      setUserCountLoading(false);
    }
  };

  return (
    <Card className="p-4 space-y-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-300">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <BugAntIcon className="h-4 w-4 text-yellow-600" />
          <span>Developer Test Controls</span>
        </h3>
        <Badge variant="outline" className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
          Development Only
        </Badge>
      </div>
      
      <div className="bg-yellow-100/50 dark:bg-yellow-900/20 rounded p-2">
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex justify-between">
            <span className="text-yellow-800 dark:text-yellow-400">Subscription:</span>
            <span className="font-medium">{subscriptionType || "unknown"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-yellow-800 dark:text-yellow-400">Resumes:</span>
            <span className="font-medium">{usageData.resumeCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-yellow-800 dark:text-yellow-400">AI Generations:</span>
            <span className="font-medium">{usageData.aiGenerationCount}</span>
          </div>
        </div>
      </div>
      
      <Separator className="bg-yellow-200 dark:bg-yellow-800/50" />
      
      <div className="space-y-3">
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-yellow-800 dark:text-yellow-400 flex items-center">
            <CreditCardIcon className="h-3.5 w-3.5 mr-1" /> 
            Subscription Testing
          </h4>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => updateSubscription('free')} 
                disabled={subscriptionLoading}
                size="sm"
                variant="outline"
                className="border-yellow-500 text-yellow-700 hover:bg-yellow-100"
              >
                Test Free Plan
              </Button>
              
              <Button 
                onClick={() => updateSubscription('premium')} 
                disabled={subscriptionLoading}
                size="sm"
                variant="outline"
                className="border-yellow-500 text-yellow-700 hover:bg-yellow-100"
              >
                Test Premium Plan
              </Button>
            </div>
          </div>
        </div>
        
        <Separator className="bg-yellow-200 dark:bg-yellow-800/50" />
        
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-yellow-800 dark:text-yellow-400 flex items-center">
            <ChartBarIcon className="h-3.5 w-3.5 mr-1" /> 
            User Usage Testing
          </h4>
          <div className="flex flex-col gap-2">
            <Button 
              onClick={incrementAICount} 
              disabled={aiTestLoading}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
            >
              <DocumentTextIcon className="h-3.5 w-3.5" />
              {aiTestLoading ? 'Processing...' : 'Increment AI Generation Count'}
            </Button>
            
            <Button 
              onClick={incrementResumeCount} 
              disabled={resumeTestLoading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
            >
              <DocumentDuplicateIcon className="h-3.5 w-3.5" />
              {resumeTestLoading ? 'Processing...' : 'Increment Resume Count'}
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => setTestUsageValues(3, 5)}
                disabled={userCountLoading}
                size="sm"
                variant="outline"
                className="border-yellow-500 text-yellow-700 hover:bg-yellow-100"
              >
                Set Test Values
              </Button>
              
              <Button 
                onClick={resetUserCounts} 
                disabled={userCountLoading}
                size="sm"
                variant="destructive"
                className="flex items-center justify-center"
              >
                Reset All Counts
              </Button>
            </div>
            
            <Button 
              onClick={getUserUsage} 
              size="sm"
              variant="outline"
              className="border-yellow-500 text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:text-yellow-300 flex items-center gap-1"
            >
              <IdentificationIcon className="h-3.5 w-3.5" />
              Refresh Usage Data
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
} 