import { SubscriptionLevel } from "./subscription";

export function canCreateResume(
  subscriptionLevel: SubscriptionLevel,
  currentResumeCount: number,
) {
  // Allow unlimited resumes for all users
  return true;
}

export function canUseAITools(subscriptionLevel: SubscriptionLevel) {
  // Allow AI tools for all users
  return true;
}

export function canUseCustomizations(subscriptionLevel: SubscriptionLevel) {
  // Allow customizations for all users
  return true;
}
