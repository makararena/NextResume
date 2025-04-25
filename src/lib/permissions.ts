import { FREE_TIER_LIMITS, SubscriptionLevel } from "./subscription";

export function canCreateResume(
  subscriptionLevel: SubscriptionLevel,
  currentResumeCount: number,
) {
  // Allow unlimited resumes for premium users
  if (subscriptionLevel === "premium") {
    return true;
  }
  
  // Check if free user has reached the limit
  return currentResumeCount < FREE_TIER_LIMITS.MAX_RESUMES;
}

export function canUseAITools(
  subscriptionLevel: SubscriptionLevel,
  currentAIGenerationCount: number = 0
) {
  // Allow unlimited AI tools for premium users
  if (subscriptionLevel === "premium") {
    return true;
  }
  
  // Check if free user has reached the limit
  return currentAIGenerationCount < FREE_TIER_LIMITS.MAX_AI_GENERATIONS;
}

export function canUseCustomizations(subscriptionLevel: SubscriptionLevel) {
  // Allow customizations for all users
  return true;
}
