"use client";

import { useEffect, useState } from "react";
import { useSubscriptionLevel } from "@/app/(main)/SubscriptionLevelProvider";
import { useToast } from "@/hooks/use-toast";
import { FREE_TIER_LIMITS } from "@/lib/subscription";

interface UsageData {
  resumeCount: number;
  aiGenerationCount: number;
}

export function useSubscriptionLimits() {
  const subscriptionLevel = useSubscriptionLevel();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/user/usage");
        if (!response.ok) {
          throw new Error("Failed to fetch usage data");
        }
        const usageData = await response.json();
        setUsage(usageData);
      } catch (error) {
        console.error("Error fetching usage:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsage();
  }, []);

  const canCreateResume = () => {
    if (subscriptionLevel === "premium") return true;
    if (!usage) return false;
    
    return usage.resumeCount < FREE_TIER_LIMITS.MAX_RESUMES;
  };

  const canUseAIGeneration = () => {
    if (subscriptionLevel === "premium") return true;
    if (!usage) return false;
    
    return usage.aiGenerationCount < FREE_TIER_LIMITS.MAX_AI_GENERATIONS;
  };

  const showUpgradeMessage = (feature: "resume" | "ai") => {
    const messages = {
      resume: `You've reached the limit of ${FREE_TIER_LIMITS.MAX_RESUMES} resumes on the free plan. Upgrade to premium for unlimited resumes.`,
      ai: `You've reached the limit of ${FREE_TIER_LIMITS.MAX_AI_GENERATIONS} AI generations on the free plan. Upgrade to premium for unlimited generations.`,
    };
    
    toast({
      title: "Subscription limit reached",
      description: messages[feature],
      duration: 5000,
    });
  };

  return {
    isLoading,
    usage,
    isPremium: subscriptionLevel === "premium",
    canCreateResume,
    canUseAIGeneration,
    showUpgradeMessage,
  };
} 