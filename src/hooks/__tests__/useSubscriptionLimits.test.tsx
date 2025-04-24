import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useSubscriptionLimits } from '../useSubscriptionLimits';
import { useSubscriptionLevel } from '@/app/(main)/SubscriptionLevelProvider';
import { FREE_TIER_LIMITS } from '@/lib/subscription';

// Mock the hooks and toast
vi.mock('@/app/(main)/SubscriptionLevelProvider', () => ({
  useSubscriptionLevel: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock fetch
global.fetch = vi.fn();

// Test component that uses our hook
function TestComponent() {
  const {
    isLoading,
    usage,
    isPremium,
    canCreateResume,
    canUseAIGeneration,
    showUpgradeMessage,
  } = useSubscriptionLimits();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'true' : 'false'}</div>
      {usage && (
        <>
          <div data-testid="resume-count">{usage.resumeCount}</div>
          <div data-testid="ai-count">{usage.aiGenerationCount}</div>
        </>
      )}
      <div data-testid="is-premium">{isPremium ? 'true' : 'false'}</div>
      <div data-testid="can-create-resume">{canCreateResume() ? 'true' : 'false'}</div>
      <div data-testid="can-use-ai">{canUseAIGeneration() ? 'true' : 'false'}</div>
      <button 
        data-testid="show-resume-message"
        onClick={() => showUpgradeMessage('resume')}
      >
        Show Resume Message
      </button>
      <button 
        data-testid="show-ai-message"
        onClick={() => showUpgradeMessage('ai')}
      >
        Show AI Message
      </button>
    </div>
  );
}

describe('useSubscriptionLimits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ resumeCount: 1, aiGenerationCount: 2 }),
    } as Response);
    vi.mocked(useSubscriptionLevel).mockReturnValue('free');
  });

  it('fetches and displays usage data', async () => {
    render(<TestComponent />);
    
    // Initially loading
    expect(screen.getByTestId('loading').textContent).toBe('true');
    
    // After loading
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('resume-count').textContent).toBe('1');
      expect(screen.getByTestId('ai-count').textContent).toBe('2');
    });
    
    // Check fetch was called
    expect(global.fetch).toHaveBeenCalledWith('/api/user/usage');
  });

  it('determines if user is premium', async () => {
    // Mock premium subscription
    vi.mocked(useSubscriptionLevel).mockReturnValue('premium');
    
    render(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('is-premium').textContent).toBe('true');
    });
  });

  it('determines if free user can create resume (under limit)', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ 
        resumeCount: FREE_TIER_LIMITS.MAX_RESUMES - 1, 
        aiGenerationCount: 2 
      }),
    } as Response);
    
    render(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('can-create-resume').textContent).toBe('true');
    });
  });

  it('determines if free user cannot create resume (at limit)', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ 
        resumeCount: FREE_TIER_LIMITS.MAX_RESUMES, 
        aiGenerationCount: 2 
      }),
    } as Response);
    
    render(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('can-create-resume').textContent).toBe('false');
    });
  });

  it('determines if free user can use AI generation (under limit)', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ 
        resumeCount: 2, 
        aiGenerationCount: FREE_TIER_LIMITS.MAX_AI_GENERATIONS - 1
      }),
    } as Response);
    
    render(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('can-use-ai').textContent).toBe('true');
    });
  });

  it('determines if free user cannot use AI generation (at limit)', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ 
        resumeCount: 2, 
        aiGenerationCount: FREE_TIER_LIMITS.MAX_AI_GENERATIONS
      }),
    } as Response);
    
    render(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('can-use-ai').textContent).toBe('false');
    });
  });

  it('allows premium users to always create resumes regardless of count', async () => {
    vi.mocked(useSubscriptionLevel).mockReturnValue('premium');
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ 
        resumeCount: FREE_TIER_LIMITS.MAX_RESUMES + 10, 
        aiGenerationCount: 2 
      }),
    } as Response);
    
    render(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('can-create-resume').textContent).toBe('true');
    });
  });

  it('allows premium users to always use AI regardless of count', async () => {
    vi.mocked(useSubscriptionLevel).mockReturnValue('premium');
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ 
        resumeCount: 2, 
        aiGenerationCount: FREE_TIER_LIMITS.MAX_AI_GENERATIONS + 10
      }),
    } as Response);
    
    render(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('can-use-ai').textContent).toBe('true');
    });
  });

  it('handles fetch errors gracefully', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));
    
    render(<TestComponent />);
    
    // Should stop loading even after error
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Default safe values should be used
    expect(screen.getByTestId('can-create-resume').textContent).toBe('false');
    expect(screen.getByTestId('can-use-ai').textContent).toBe('false');
  });

  it('shows upgrade messages with correct limit info', async () => {
    const toastMock = vi.fn();
    vi.mocked(require('@/hooks/use-toast').useToast).mockReturnValue({
      toast: toastMock,
    });
    
    render(<TestComponent />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Test resume limit message
    screen.getByTestId('show-resume-message').click();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: "Subscription limit reached",
      description: `You've reached the limit of ${FREE_TIER_LIMITS.MAX_RESUMES} resumes on the free plan. Upgrade to premium for unlimited resumes.`,
    }));
    
    // Test AI generation limit message
    vi.clearAllMocks();
    screen.getByTestId('show-ai-message').click();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: "Subscription limit reached",
      description: `You've reached the limit of ${FREE_TIER_LIMITS.MAX_AI_GENERATIONS} AI generations on the free plan. Upgrade to premium for unlimited generations.`,
    }));
  });
}); 