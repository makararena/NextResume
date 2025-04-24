import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../user/usage/route';
import { POST as incrementResumePost } from '../user/increment-resume/route';
import { POST as incrementAiGenerationPost } from '../user/increment-ai-generation/route';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as subscription from '@/lib/subscription';

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data: any, options?: any) => ({ data, options })),
  }
}));

// Mock auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: 'test-user-id' })),
}));

// Mock DB
vi.mock('@/lib/db', () => ({
  db: {
    resume: {
      count: vi.fn(),
    },
    userUsage: {
      update: vi.fn(),
      findUnique: vi.fn(),
    }
  }
}));

// Mock subscription functions
vi.mock('@/lib/subscription', () => ({
  getUserUsage: vi.fn(),
  incrementResumeCount: vi.fn(),
  incrementAiGenerationCount: vi.fn(),
}));

describe('User Usage API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/user/usage', () => {
    it('returns usage data for authenticated users', async () => {
      // Mock implementation
      vi.mocked(subscription.getUserUsage).mockResolvedValue({
        resumeCount: 2,
        aiGenerationCount: 5,
      });
      
      vi.mocked(db.resume.count).mockResolvedValue(2);
      
      const response = await GET();
      
      expect(subscription.getUserUsage).toHaveBeenCalledWith('test-user-id');
      expect(db.resume.count).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' }
      });
      expect(NextResponse.json).toHaveBeenCalledWith({
        resumeCount: 2,
        aiGenerationCount: 5,
      });
    });

    it('updates usage when resume count differs from stored count', async () => {
      // Mock implementation
      vi.mocked(subscription.getUserUsage).mockResolvedValue({
        resumeCount: 2,
        aiGenerationCount: 5,
      });
      
      // Actual count is different
      vi.mocked(db.resume.count).mockResolvedValue(3);
      
      vi.mocked(db.userUsage.update).mockResolvedValue({
        id: 'usage-id',
        userId: 'test-user-id',
        resumeCount: 3,
        aiGenerationCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const response = await GET();
      
      expect(db.userUsage.update).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
        data: { resumeCount: 3 }
      });
      
      expect(NextResponse.json).toHaveBeenCalledWith({
        resumeCount: 3,
        aiGenerationCount: 5,
      });
    });

    it('returns default values for unauthenticated users', async () => {
      // Mock unauthenticated user
      vi.mocked(require('@clerk/nextjs/server').auth).mockReturnValueOnce({
        userId: null
      });
      
      const response = await GET();
      
      expect(subscription.getUserUsage).not.toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith({
        resumeCount: 0,
        aiGenerationCount: 0,
      });
    });
  });

  describe('POST /api/user/increment-resume', () => {
    it('increments resume count for authenticated users', async () => {
      // Mock successful increment
      vi.mocked(subscription.incrementResumeCount).mockResolvedValue(true);
      
      const response = await incrementResumePost();
      
      expect(subscription.incrementResumeCount).toHaveBeenCalledWith('test-user-id');
      expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
    });

    it('returns error when user hits resume limit', async () => {
      // Mock unsuccessful increment (limit reached)
      vi.mocked(subscription.incrementResumeCount).mockResolvedValue(false);
      
      const response = await incrementResumePost();
      
      expect(subscription.incrementResumeCount).toHaveBeenCalledWith('test-user-id');
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Resume limit reached" },
        { status: 403 }
      );
    });

    it('returns unauthorized for unauthenticated users', async () => {
      // Mock unauthenticated user
      vi.mocked(require('@clerk/nextjs/server').auth).mockReturnValueOnce({
        userId: null
      });
      
      const response = await incrementResumePost();
      
      expect(subscription.incrementResumeCount).not.toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Unauthorized" },
        { status: 401 }
      );
    });
  });

  describe('POST /api/user/increment-ai-generation', () => {
    it('increments AI generation count for authenticated users', async () => {
      // Mock successful increment
      vi.mocked(subscription.incrementAiGenerationCount).mockResolvedValue(true);
      
      const response = await incrementAiGenerationPost();
      
      expect(subscription.incrementAiGenerationCount).toHaveBeenCalledWith('test-user-id');
      expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
    });

    it('returns error when user hits AI generation limit', async () => {
      // Mock unsuccessful increment (limit reached)
      vi.mocked(subscription.incrementAiGenerationCount).mockResolvedValue(false);
      
      const response = await incrementAiGenerationPost();
      
      expect(subscription.incrementAiGenerationCount).toHaveBeenCalledWith('test-user-id');
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "AI generation limit reached" },
        { status: 403 }
      );
    });

    it('returns unauthorized for unauthenticated users', async () => {
      // Mock unauthenticated user
      vi.mocked(require('@clerk/nextjs/server').auth).mockReturnValueOnce({
        userId: null
      });
      
      const response = await incrementAiGenerationPost();
      
      expect(subscription.incrementAiGenerationCount).not.toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Unauthorized" },
        { status: 401 }
      );
    });
  });
}); 