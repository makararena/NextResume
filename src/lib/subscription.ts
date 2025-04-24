import { cache } from "react";
import { db } from "@/lib/db";

export type SubscriptionLevel = "free" | "premium";

export const FREE_TIER_LIMITS = {
  MAX_RESUMES: 3,
  MAX_AI_GENERATIONS: 10,
};

export const getUserSubscriptionLevel = cache(
  async (userId: string): Promise<SubscriptionLevel> => {
    if (!userId) return "free";

    try {
      const userSubscription = await db.userSubscription.findUnique({
        where: { userId },
      });

      // If no subscription exists, user is on free tier
      if (!userSubscription) {
        return "free";
      }

      // Check if user has an active premium subscription
      if (userSubscription.plan === "premium") {
        // For Stripe subscription, check if it's still valid
        if (
          userSubscription.stripeCurrentPeriodEnd &&
          userSubscription.stripeCurrentPeriodEnd.getTime() > Date.now()
        ) {
          return "premium";
        }
      }

      // Default to free tier
      return "free";
    } catch (error) {
      console.error("Error getting user subscription level:", error);
      return "free";
    }
  },
);

export const getUserUsage = cache(
  async (userId: string) => {
    if (!userId) return { resumeCount: 0, aiGenerationCount: 0 };

    try {
      // Get or create user usage record
      let userUsage = await db.userUsage.findUnique({
        where: { userId },
      });

      if (!userUsage) {
        userUsage = await db.userUsage.create({
          data: { userId, resumeCount: 0, aiGenerationCount: 0 },
        });
      }

      return userUsage;
    } catch (error) {
      console.error("Error getting user usage:", error);
      return { resumeCount: 0, aiGenerationCount: 0 };
    }
  }
);

export async function incrementResumeCount(userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const subscriptionLevel = await getUserSubscriptionLevel(userId);
    
    // Premium users have unlimited resumes
    if (subscriptionLevel === "premium") {
      return true;
    }

    const userUsage = await getUserUsage(userId);
    
    // Check if user has reached the free tier limit
    if (userUsage.resumeCount >= FREE_TIER_LIMITS.MAX_RESUMES) {
      return false;
    }

    // Increment the resume count
    await db.userUsage.upsert({
      where: { userId },
      update: { resumeCount: userUsage.resumeCount + 1 },
      create: { userId, resumeCount: 1, aiGenerationCount: 0 },
    });

    return true;
  } catch (error) {
    console.error("Error incrementing resume count:", error);
    return false;
  }
}

export async function incrementAiGenerationCount(userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const subscriptionLevel = await getUserSubscriptionLevel(userId);
    
    // Premium users have unlimited AI generations
    if (subscriptionLevel === "premium") {
      return true;
    }

    const userUsage = await getUserUsage(userId);
    
    // Check if user has reached the free tier limit
    if (userUsage.aiGenerationCount >= FREE_TIER_LIMITS.MAX_AI_GENERATIONS) {
      return false;
    }

    // Increment the AI generation count
    await db.userUsage.upsert({
      where: { userId },
      update: { aiGenerationCount: userUsage.aiGenerationCount + 1 },
      create: { userId, resumeCount: 0, aiGenerationCount: 1 },
    });

    return true;
  } catch (error) {
    console.error("Error incrementing AI generation count:", error);
    return false;
  }
}
