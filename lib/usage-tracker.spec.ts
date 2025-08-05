import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usageTracker, UsageTracker } from './usage-tracker';
import { db } from '@/db/drizzle';

// Mock the database
vi.mock('@/db/drizzle');
const mockDb = vi.mocked(db);

describe('UsageTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:00:00Z')); // Mid-month for consistent testing
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getUserUsage', () => {
    it('should return correct usage info for starter plan', async () => {
      // Mock subscription query (no active subscription = starter)
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]), // No subscription = starter
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Mock monthly conversions count
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        count: 45,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await usageTracker.getUserUsage('test-user');

      expect(result.articlesUsed).toBe(45);
      expect(result.articlesLimit).toBe(100);
      expect(result.subscriptionTier).toBe('starter');
      expect(result.subscriptionStatus).toBe('inactive');
      expect(result.canConvert).toBe(true);
      expect(result.daysUntilReset).toBeGreaterThan(0);
    });

    it('should return correct usage info for pro plan', async () => {
      // Mock active subscription
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ status: 'active' }]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Mock monthly conversions count
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        count: 250,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await usageTracker.getUserUsage('test-user');

      expect(result.articlesUsed).toBe(250);
      expect(result.articlesLimit).toBe(300);
      expect(result.subscriptionTier).toBe('pro');
      expect(result.subscriptionStatus).toBe('active');
      expect(result.canConvert).toBe(true);
    });

    it('should indicate when user cannot convert (limit reached)', async () => {
      // Mock no subscription
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Mock limit reached
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        count: 100, // Exactly at limit
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await usageTracker.getUserUsage('test-user');

      expect(result.canConvert).toBe(false);
      expect(result.articlesUsed).toBe(100);
      expect(result.articlesLimit).toBe(100);
    });

    it('should calculate days until reset correctly', async () => {
      // Set specific date for predictable testing
      vi.setSystemTime(new Date('2025-01-15T10:00:00Z'));

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        count: 10,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await usageTracker.getUserUsage('test-user');

      // Should be around 17 days from Jan 15 to Feb 1
      expect(result.daysUntilReset).toBeGreaterThan(15);
      expect(result.daysUntilReset).toBeLessThan(20);
    });
  });

  describe('canUserConvert', () => {
    it('should allow conversion when under limit', async () => {
      // Mock usage under limit
      const tracker = new UsageTracker();
      vi.spyOn(tracker, 'getUserUsage').mockResolvedValue({
        articlesUsed: 50,
        articlesLimit: 100,
        subscriptionTier: 'starter',
        subscriptionStatus: 'inactive',
        canConvert: true,
        daysUntilReset: 15,
      });

      const result = await tracker.canUserConvert('test-user');

      expect(result.canConvert).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should deny conversion when at limit', async () => {
      const tracker = new UsageTracker();
      vi.spyOn(tracker, 'getUserUsage').mockResolvedValue({
        articlesUsed: 100,
        articlesLimit: 100,
        subscriptionTier: 'starter',
        subscriptionStatus: 'inactive',
        canConvert: false,
        daysUntilReset: 15,
      });

      const result = await tracker.canUserConvert('test-user');

      expect(result.canConvert).toBe(false);
      expect(result.reason).toContain('Monthly limit reached');
      expect(result.reason).toContain('100/100');
      expect(result.reason).toContain('15 days');
    });
  });

  describe('getUserConversions', () => {
    it('should return paginated conversions', async () => {
      const mockConversions = [
        { id: '1', title: 'Article 1', createdAt: new Date() },
        { id: '2', title: 'Article 2', createdAt: new Date() },
      ];

      // Mock total count query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        count: 25,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Mock conversions query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockConversions),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await usageTracker.getUserConversions('test-user', 1, 20);

      expect(result.conversions).toEqual(mockConversions);
      expect(result.totalCount).toBe(25);
      expect(result.hasMore).toBe(true);
    });

    it('should indicate no more pages when at end', async () => {
      const mockConversions = [
        { id: '1', title: 'Article 1', createdAt: new Date() },
      ];

      // Mock total count
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        count: 1,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Mock conversions
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockConversions),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await usageTracker.getUserConversions('test-user', 1, 20);

      expect(result.hasMore).toBe(false);
    });
  });

  describe('getGlobalUsageStats', () => {
    it('should return global statistics', async () => {
      // Mock all the database queries for global stats
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          count: 1000, // totalUsers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          count: 50000, // totalConversions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          count: 5000, // monthlyConversions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          count: 200, // activeSubscriptions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await usageTracker.getGlobalUsageStats();

      expect(result.totalUsers).toBe(1000);
      expect(result.totalConversions).toBe(50000);
      expect(result.monthlyConversions).toBe(5000);
      expect(result.activeSubscriptions).toBe(200);
    });
  });

  describe('checkAndSendUsageAlerts', () => {
    it('should send alert when approaching limit (80%)', async () => {
      const tracker = new UsageTracker();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      vi.spyOn(tracker, 'getUserUsage').mockResolvedValue({
        articlesUsed: 85,
        articlesLimit: 100,
        subscriptionTier: 'starter',
        subscriptionStatus: 'inactive',
        canConvert: true,
        daysUntilReset: 15,
      });

      await tracker.checkAndSendUsageAlerts('test-user');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('approaching_limit'),
        expect.stringContaining('test-user'),
        expect.any(Object)
      );
    });

    it('should send alert when limit reached (100%)', async () => {
      const tracker = new UsageTracker();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      vi.spyOn(tracker, 'getUserUsage').mockResolvedValue({
        articlesUsed: 100,
        articlesLimit: 100,
        subscriptionTier: 'starter',
        subscriptionStatus: 'inactive',
        canConvert: false,
        daysUntilReset: 15,
      });

      await tracker.checkAndSendUsageAlerts('test-user');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('limit_reached'),
        expect.stringContaining('test-user'),
        expect.any(Object)
      );
    });

    it('should not send alert when usage is low', async () => {
      const tracker = new UsageTracker();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      vi.spyOn(tracker, 'getUserUsage').mockResolvedValue({
        articlesUsed: 30,
        articlesLimit: 100,
        subscriptionTier: 'starter',
        subscriptionStatus: 'inactive',
        canConvert: true,
        daysUntilReset: 15,
      });

      await tracker.checkAndSendUsageAlerts('test-user');

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});