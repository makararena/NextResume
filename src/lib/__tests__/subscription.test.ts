import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  getUserSubscriptionLevel, 
  getUserUsage, 
  incrementResumeCount, 
  incrementAiGenerationCount,
  FREE_TIER_LIMITS 
} from '../subscription';
import { db } from '../db';

// Mock the database
vi.mock('../db', () => ({
  db: {
    userSubscription: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    userUsage: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    resume: {
      count: vi.fn(),
    }
  }
}));

// Mock auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: 'test-user-id' })),
}));

describe('Subscription functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getUserSubscriptionLevel', () => {
    it('returns "free" for users without a subscription record', async () => {
      // Mock database response for a user without subscription
      vi.mocked(db.userSubscription.findUnique).mockResolvedValue(null);
      
      const result = await getUserSubscriptionLevel('test-user-id');
      
      expect(result).toBe('free');
      expect(db.userSubscription.findUnique).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' }
      });
    });

    it('returns premium for users with an active premium subscription', async () => {
      // Mock database response for a premium user
      vi.mocked(db.userSubscription.findUnique).mockResolvedValue({
        id: 'subscription-id',
        userId: 'test-user-id',
        plan: 'premium',
        stripeCustomerId: 'customer-id',
        stripeSubscriptionId: 'subscription-id',
        stripePriceId: 'price-id',
        stripeCurrentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days in the future
        stripeCancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const result = await getUserSubscriptionLevel('test-user-id');
      
      expect(result).toBe('premium');
    });

    it('returns free for users with an expired premium subscription', async () => {
      // Mock database response for a user with expired subscription
      vi.mocked(db.userSubscription.findUnique).mockResolvedValue({
        id: 'subscription-id',
        userId: 'test-user-id',
        plan: 'premium',
        stripeCustomerId: 'customer-id',
        stripeSubscriptionId: 'subscription-id',
        stripePriceId: 'price-id',
        stripeCurrentPeriodEnd: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day in the past
        stripeCancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const result = await getUserSubscriptionLevel('test-user-id');
      
      expect(result).toBe('free');
    });
  });

  describe('getUserUsage', () => {
    it('creates a new usage record if none exists', async () => {
      // Mock database responses
      vi.mocked(db.userUsage.findUnique).mockResolvedValue(null);
      vi.mocked(db.userUsage.create).mockResolvedValue({
        id: 'usage-id',
        userId: 'test-user-id',
        resumeCount: 0,
        aiGenerationCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const result = await getUserUsage('test-user-id');
      
      expect(result).toEqual(expect.objectContaining({
        resumeCount: 0,
        aiGenerationCount: 0,
      }));
      expect(db.userUsage.create).toHaveBeenCalledWith({
        data: { 
          userId: 'test-user-id', 
          resumeCount: 0, 
          aiGenerationCount: 0 
        }
      });
    });

    it('returns existing usage data if it exists', async () => {
      // Mock database response
      vi.mocked(db.userUsage.findUnique).mockResolvedValue({
        id: 'usage-id',
        userId: 'test-user-id',
        resumeCount: 2,
        aiGenerationCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const result = await getUserUsage('test-user-id');
      
      expect(result).toEqual(expect.objectContaining({
        resumeCount: 2,
        aiGenerationCount: 5,
      }));
      expect(db.userUsage.create).not.toHaveBeenCalled();
    });
  });

  describe('incrementResumeCount', () => {
    it('allows premium users to create unlimited resumes', async () => {
      // Mock premium subscription
      vi.mocked(db.userSubscription.findUnique).mockResolvedValue({
        id: 'subscription-id',
        userId: 'test-user-id',
        plan: 'premium',
        stripeCurrentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        stripeCancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        stripeCustomerId: 'customer-id',
        stripeSubscriptionId: 'subscription-id',
        stripePriceId: 'price-id',
      });
      
      const result = await incrementResumeCount('test-user-id');
      
      expect(result).toBe(true);
      // Should not check usage for premium users
      expect(db.userUsage.findUnique).not.toHaveBeenCalled();
      // Should not update usage for premium users
      expect(db.userUsage.upsert).not.toHaveBeenCalled();
    });

    it('allows free users to create resumes under the limit', async () => {
      // Mock free subscription
      vi.mocked(db.userSubscription.findUnique).mockResolvedValue(null);
      
      // Mock current usage below limit
      vi.mocked(db.userUsage.findUnique).mockResolvedValue({
        id: 'usage-id',
        userId: 'test-user-id',
        resumeCount: FREE_TIER_LIMITS.MAX_RESUMES - 1,
        aiGenerationCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Mock successful update
      vi.mocked(db.userUsage.upsert).mockResolvedValue({
        id: 'usage-id',
        userId: 'test-user-id',
        resumeCount: FREE_TIER_LIMITS.MAX_RESUMES,
        aiGenerationCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const result = await incrementResumeCount('test-user-id');
      
      expect(result).toBe(true);
      expect(db.userUsage.upsert).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
        update: { resumeCount: FREE_TIER_LIMITS.MAX_RESUMES },
        create: { userId: 'test-user-id', resumeCount: 1, aiGenerationCount: 0 },
      });
    });

    it('prevents free users from creating resumes at the limit', async () => {
      // Mock free subscription
      vi.mocked(db.userSubscription.findUnique).mockResolvedValue(null);
      
      // Mock current usage at limit
      vi.mocked(db.userUsage.findUnique).mockResolvedValue({
        id: 'usage-id',
        userId: 'test-user-id',
        resumeCount: FREE_TIER_LIMITS.MAX_RESUMES,
        aiGenerationCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const result = await incrementResumeCount('test-user-id');
      
      expect(result).toBe(false);
      // Should not try to update usage
      expect(db.userUsage.upsert).not.toHaveBeenCalled();
    });
  });

  describe('incrementAiGenerationCount', () => {
    it('allows premium users to use unlimited AI generations', async () => {
      // Mock premium subscription
      vi.mocked(db.userSubscription.findUnique).mockResolvedValue({
        id: 'subscription-id',
        userId: 'test-user-id',
        plan: 'premium',
        stripeCurrentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        stripeCancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        stripeCustomerId: 'customer-id',
        stripeSubscriptionId: 'subscription-id',
        stripePriceId: 'price-id',
      });
      
      const result = await incrementAiGenerationCount('test-user-id');
      
      expect(result).toBe(true);
      // Should not check usage for premium users
      expect(db.userUsage.findUnique).not.toHaveBeenCalled();
      // Should not update usage for premium users
      expect(db.userUsage.upsert).not.toHaveBeenCalled();
    });

    it('allows free users to use AI generations under the limit', async () => {
      // Mock free subscription
      vi.mocked(db.userSubscription.findUnique).mockResolvedValue(null);
      
      // Mock current usage below limit
      vi.mocked(db.userUsage.findUnique).mockResolvedValue({
        id: 'usage-id',
        userId: 'test-user-id',
        resumeCount: 0,
        aiGenerationCount: FREE_TIER_LIMITS.MAX_AI_GENERATIONS - 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Mock successful update
      vi.mocked(db.userUsage.upsert).mockResolvedValue({
        id: 'usage-id',
        userId: 'test-user-id',
        resumeCount: 0,
        aiGenerationCount: FREE_TIER_LIMITS.MAX_AI_GENERATIONS,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const result = await incrementAiGenerationCount('test-user-id');
      
      expect(result).toBe(true);
      expect(db.userUsage.upsert).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
        update: { aiGenerationCount: FREE_TIER_LIMITS.MAX_AI_GENERATIONS },
        create: { userId: 'test-user-id', resumeCount: 0, aiGenerationCount: 1 },
      });
    });

    it('prevents free users from using AI generations at the limit', async () => {
      // Mock free subscription
      vi.mocked(db.userSubscription.findUnique).mockResolvedValue(null);
      
      // Mock current usage at limit
      vi.mocked(db.userUsage.findUnique).mockResolvedValue({
        id: 'usage-id',
        userId: 'test-user-id',
        resumeCount: 0,
        aiGenerationCount: FREE_TIER_LIMITS.MAX_AI_GENERATIONS,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const result = await incrementAiGenerationCount('test-user-id');
      
      expect(result).toBe(false);
      // Should not try to update usage
      expect(db.userUsage.upsert).not.toHaveBeenCalled();
    });
  });
}); 