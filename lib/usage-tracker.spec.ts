import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usageTracker } from './usage-tracker';
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
      // Mock subscription query - returns empty array for starter plan
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]), // No subscription = starter
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Mock monthly conversions count query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 45 }]),
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
        where: vi.fn().mockResolvedValue([{ count: 250 }]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await usageTracker.getUserUsage('test-user');

      expect(result.articlesUsed).toBe(250);
      expect(result.articlesLimit).toBe(300);
      expect(result.subscriptionTier).toBe('pro');
      expect(result.subscriptionStatus).toBe('active');
      expect(result.canConvert).toBe(true);
      expect(result.daysUntilReset).toBeGreaterThan(0);
    });

    it('should indicate when user cannot convert (limit reached)', async () => {
      // Mock no subscription (starter)
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Mock monthly conversions count (at limit)
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 100 }]), // Exactly at limit
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await usageTracker.getUserUsage('test-user');

      expect(result.articlesUsed).toBe(100);
      expect(result.articlesLimit).toBe(100);
      expect(result.canConvert).toBe(false);
    });

    it('should calculate days until reset correctly', async () => {
      // Mock no subscription (starter)
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Mock monthly conversions count
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 10 }]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await usageTracker.getUserUsage('test-user');

      // Should be around 16-17 days until next month (from Jan 15)
      expect(result.daysUntilReset).toBeGreaterThan(15);
      expect(result.daysUntilReset).toBeLessThan(18);
    });
  });

  describe('canUserConvert', () => {
    it('should allow conversion when under limit', async () => {
      // Mock for getUserUsage call
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 50 }]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await usageTracker.canUserConvert('test-user');

      expect(result.canConvert).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should deny conversion when at limit', async () => {
      // Mock for getUserUsage call
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 100 }]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await usageTracker.canUserConvert('test-user');

      expect(result.canConvert).toBe(false);
      expect(result.reason).toContain('Monthly limit reached');
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
        where: vi.fn().mockResolvedValue([{ count: 25 }]),
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

      const result = await usageTracker.getUserConversions('test-user', 1, 10);

      expect(result.conversions).toEqual(mockConversions);
      expect(result.totalCount).toBe(25);
      expect(result.hasMore).toBe(true);
    });

    it('should indicate no more pages when at end', async () => {
      // Mock total count query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 1 }]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Mock conversions query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await usageTracker.getUserConversions('test-user', 1, 10);

      expect(result.hasMore).toBe(false);
    });
  });

  describe('getGlobalUsageStats', () => {
    it('should return global statistics', async () => {
      // Mock total users count
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockResolvedValue([{ count: 150 }]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Mock total conversions count
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockResolvedValue([{ count: 2500 }]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Mock monthly conversions count
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 450 }]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Mock active subscriptions count
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 25 }]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await usageTracker.getGlobalUsageStats();

      expect(result.totalUsers).toBe(150);
      expect(result.totalConversions).toBe(2500);
      expect(result.monthlyConversions).toBe(450);
      expect(result.activeSubscriptions).toBe(25);
    });
  });

  describe('checkAndSendUsageAlerts', () => {
    it('should send alert when approaching limit (80%)', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Mock subscription query for getUserUsage
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Mock monthly conversions count (85% of limit)
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 85 }]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await usageTracker.checkAndSendUsageAlerts('test-user');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Usage alert: approaching_limit for user test-user'),
        expect.objectContaining({
          articlesUsed: 85,
          articlesLimit: 100,
        })
      );

      consoleSpy.mockRestore();
    });

    it('should send alert when limit reached (100%)', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Mock subscription query for getUserUsage
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Mock monthly conversions count (100% of limit)
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 100 }]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await usageTracker.checkAndSendUsageAlerts('test-user');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Usage alert: limit_reached for user test-user'),
        expect.objectContaining({
          articlesUsed: 100,
          articlesLimit: 100,
        })
      );

      consoleSpy.mockRestore();
    });

    it('should not send alert when usage is low', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Mock subscription query for getUserUsage
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Mock monthly conversions count (50% of limit)
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 50 }]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await usageTracker.checkAndSendUsageAlerts('test-user');

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});