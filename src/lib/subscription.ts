import { cache } from "react";

export type SubscriptionLevel = "free" | "pro" | "pro_plus";

export const getUserSubscriptionLevel = cache(
  async (userId: string): Promise<SubscriptionLevel> => {
    // Always return free since we've removed subscriptions
    return "free";
  },
);
