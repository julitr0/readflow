import { db } from '@/db/drizzle';
import { conversion, subscription, userSettings } from '@/db/schema';
import { eq, and, gte, count } from 'drizzle-orm';

export interface UsageInfo {
  articlesUsed: number;
  articlesLimit: number;
  subscriptionTier: 'starter' | 'pro';
  subscriptionStatus: 'active' | 'inactive';
  canConvert: boolean;
  daysUntilReset: number;
}

export class UsageTracker {
  /**
   * Get current usage info for a user
   */
  async getUserUsage(userId: string): Promise<UsageInfo> {
    // Get current month start
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    // Get next month start for days until reset
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const daysUntilReset = Math.ceil((nextMonth.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    // Get user subscription
    const userSubscription = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);

    const subscriptionTier = userSubscription[0]?.status === 'active' ? 'pro' : 'starter';
    const subscriptionStatus = userSubscription[0]?.status === 'active' ? 'active' : 'inactive';
    const articlesLimit = subscriptionTier === 'pro' ? 300 : 100;

    // Get monthly conversions count
    const [monthlyConversions] = await db
      .select({ count: count() })
      .from(conversion)
      .where(
        and(
          eq(conversion.userId, userId),
          gte(conversion.createdAt, currentMonth)
        )
      );

    const articlesUsed = monthlyConversions?.count || 0;
    const canConvert = articlesUsed < articlesLimit;

    return {
      articlesUsed,
      articlesLimit,
      subscriptionTier,
      subscriptionStatus,
      canConvert,
      daysUntilReset,
    };
  }

  /**
   * Check if user can convert an article
   */
  async canUserConvert(userId: string): Promise<{ canConvert: boolean; reason?: string }> {
    const usage = await this.getUserUsage(userId);

    if (!usage.canConvert) {
      return {
        canConvert: false,
        reason: `Monthly limit reached (${usage.articlesUsed}/${usage.articlesLimit}). Upgrade your plan or wait ${usage.daysUntilReset} days for reset.`
      };
    }

    return { canConvert: true };
  }

  /**
   * Track a new conversion
   */
  async trackConversion(userId: string, conversionId: string): Promise<void> {
    // The conversion is already created in the database
    // This method can be used for additional tracking if needed
    console.log(`Conversion tracked: ${conversionId} for user ${userId}`);
  }

  /**
   * Get usage statistics for admin/analytics
   */
  async getGlobalUsageStats(): Promise<{
    totalUsers: number;
    totalConversions: number;
    monthlyConversions: number;
    activeSubscriptions: number;
  }> {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const [totalUsers] = await db
      .select({ count: count() })
      .from(userSettings);

    const [totalConversions] = await db
      .select({ count: count() })
      .from(conversion);

    const [monthlyConversions] = await db
      .select({ count: count() })
      .from(conversion)
      .where(gte(conversion.createdAt, currentMonth));

    const [activeSubscriptions] = await db
      .select({ count: count() })
      .from(subscription)
      .where(eq(subscription.status, 'active'));

    return {
      totalUsers: totalUsers?.count || 0,
      totalConversions: totalConversions?.count || 0,
      monthlyConversions: monthlyConversions?.count || 0,
      activeSubscriptions: activeSubscriptions?.count || 0,
    };
  }

  /**
   * Get user's conversion history with pagination
   */
  async getUserConversions(
    userId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<{
    conversions: unknown[];
    totalCount: number;
    hasMore: boolean;
  }> {
    const offset = (page - 1) * limit;

    // Get total count
    const [totalCount] = await db
      .select({ count: count() })
      .from(conversion)
      .where(eq(conversion.userId, userId));

    // Get conversions
    const conversions = await db
      .select()
      .from(conversion)
      .where(eq(conversion.userId, userId))
      .orderBy(conversion.createdAt)
      .limit(limit)
      .offset(offset);

    const hasMore = offset + conversions.length < (totalCount?.count || 0);

    return {
      conversions,
      totalCount: totalCount?.count || 0,
      hasMore,
    };
  }

  /**
   * Send usage alerts when approaching limits
   */
  async checkAndSendUsageAlerts(userId: string): Promise<void> {
    const usage = await this.getUserUsage(userId);
    const usagePercentage = (usage.articlesUsed / usage.articlesLimit) * 100;

    // Send alerts at 80% and 95% usage
    if (usagePercentage >= 95 && !usage.canConvert) {
      await this.sendUsageAlert(userId, 'limit_reached', usage);
    } else if (usagePercentage >= 80) {
      await this.sendUsageAlert(userId, 'approaching_limit', usage);
    }
  }

  /**
   * Send usage alert email
   */
  private async sendUsageAlert(
    userId: string, 
    alertType: 'approaching_limit' | 'limit_reached',
    usage: UsageInfo
  ): Promise<void> {
    // TODO: Implement email notification
    // For now, just log the alert
    console.log(`Usage alert: ${alertType} for user ${userId}`, usage);
    
    // In production, you would:
    // 1. Get user email from database
    // 2. Send email using your email service (e.g., Resend, SendGrid)
    // 3. Track that alert was sent to avoid duplicates
  }
}

// Export singleton instance
export const usageTracker = new UsageTracker();