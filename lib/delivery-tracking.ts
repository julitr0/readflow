import { db } from "@/db/drizzle";
import { conversion, userSettings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
// import { notificationService } from "./notification-service"; // TODO: Implement delivery notifications

export interface DeliveryStatus {
  conversionId: string;
  status: "pending" | "processing" | "completed" | "failed";
  title: string;
  author: string;
  createdAt: Date;
  completedAt?: Date;
  deliveredAt?: Date;
  error?: string;
}

export class DeliveryTrackingService {
  /**
   * Get delivery status for a specific conversion
   */
  async getDeliveryStatus(
    conversionId: string,
    userId: string,
  ): Promise<DeliveryStatus | null> {
    try {
      const result = await db
        .select()
        .from(conversion)
        .where(
          and(eq(conversion.id, conversionId), eq(conversion.userId, userId)),
        )
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const conv = result[0];
      return {
        conversionId: conv.id,
        status: conv.status as
          | "pending"
          | "processing"
          | "completed"
          | "failed",
        title: conv.title,
        author: conv.author,
        createdAt: conv.createdAt,
        completedAt: conv.completedAt || undefined,
        deliveredAt: conv.deliveredAt || undefined,
        error: conv.error || undefined,
      };
    } catch (error) {
      console.error("Failed to get delivery status:", error);
      return null;
    }
  }

  /**
   * Get recent delivery history for user
   */
  async getDeliveryHistory(
    userId: string,
    limit: number = 10,
  ): Promise<DeliveryStatus[]> {
    try {
      const results = await db
        .select()
        .from(conversion)
        .where(eq(conversion.userId, userId))
        .orderBy(conversion.createdAt)
        .limit(limit);

      return results.map((conv) => ({
        conversionId: conv.id,
        status: conv.status as
          | "pending"
          | "processing"
          | "completed"
          | "failed",
        title: conv.title,
        author: conv.author,
        createdAt: conv.createdAt,
        completedAt: conv.completedAt || undefined,
        deliveredAt: conv.deliveredAt || undefined,
        error: conv.error || undefined,
      }));
    } catch (error) {
      console.error("Failed to get delivery history:", error);
      return [];
    }
  }

  /**
   * Send delivery confirmation notification to user
   */
  async sendDeliveryConfirmation(conversionId: string): Promise<void> {
    try {
      const conversionData = await db
        .select({
          conversion: conversion,
          userEmail: userSettings.userId, // We'll need to join with user table
        })
        .from(conversion)
        .innerJoin(userSettings, eq(userSettings.userId, conversion.userId))
        .where(eq(conversion.id, conversionId))
        .limit(1);

      if (conversionData.length === 0) {
        console.warn(
          `Conversion not found for delivery confirmation: ${conversionId}`,
        );
        return;
      }

      const { conversion: conv } = conversionData[0];

      // Send confirmation email (implement this based on your notification preferences)
      console.log(
        `📚 Article "${conv.title}" delivered successfully to Kindle!`,
      );

      // You could extend this to send actual email notifications
      // await notificationService.sendDeliveryConfirmation({...});
    } catch (error) {
      console.error("Failed to send delivery confirmation:", error);
    }
  }

  /**
   * Mark conversion as failed with error message
   */
  async markConversionFailed(
    conversionId: string,
    error: string,
  ): Promise<void> {
    try {
      await db
        .update(conversion)
        .set({
          status: "failed",
          error,
          updatedAt: new Date(),
        })
        .where(eq(conversion.id, conversionId));

      console.log(`Conversion marked as failed: ${conversionId} - ${error}`);
    } catch (dbError) {
      console.error("Failed to mark conversion as failed:", dbError);
    }
  }

  /**
   * Get conversion statistics for user (for dashboard)
   */
  async getConversionStats(userId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    pending: number;
    successRate: number;
  }> {
    try {
      const results = await db
        .select()
        .from(conversion)
        .where(eq(conversion.userId, userId));

      const total = results.length;
      const completed = results.filter((c) => c.status === "completed").length;
      const failed = results.filter((c) => c.status === "failed").length;
      const pending = results.filter(
        (c) => c.status === "pending" || c.status === "processing",
      ).length;
      const successRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        total,
        completed,
        failed,
        pending,
        successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
      };
    } catch (error) {
      console.error("Failed to get conversion stats:", error);
      return {
        total: 0,
        completed: 0,
        failed: 0,
        pending: 0,
        successRate: 0,
      };
    }
  }
}

// Export singleton instance
export const deliveryTracker = new DeliveryTrackingService();
