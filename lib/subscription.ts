import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getSubscriptionStatus } from "@/lib/stripe";

export type SubscriptionDetails = {
  id: string;
  priceId: string;
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
};

export type SubscriptionDetailsResult = {
  hasSubscription: boolean;
  subscription?: SubscriptionDetails;
  error?: string;
};

export async function getSubscriptionDetails(): Promise<SubscriptionDetailsResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { hasSubscription: false };
    }

    // Get user settings with Stripe subscription info
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.user.id))
      .limit(1);

    if (!settings?.stripeCustomerId || !settings?.stripeSubscriptionId) {
      return { hasSubscription: false };
    }

    // Get current subscription status from Stripe
    const stripeSubscription = await getSubscriptionStatus(settings.stripeCustomerId);
    
    if (!stripeSubscription) {
      return { hasSubscription: false };
    }

    // Update local database with latest info
    await db
      .update(userSettings)
      .set({
        subscriptionStatus: stripeSubscription.status,
        subscriptionPriceId: stripeSubscription.priceId,
        subscriptionCurrentPeriodEnd: stripeSubscription.currentPeriodEnd,
        subscriptionCancelAtPeriodEnd: stripeSubscription.cancelAtPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, session.user.id));

    return {
      hasSubscription: true,
      subscription: {
        id: stripeSubscription.id,
        priceId: stripeSubscription.priceId || '',
        status: stripeSubscription.status,
        currentPeriodEnd: stripeSubscription.currentPeriodEnd,
        cancelAtPeriodEnd: stripeSubscription.cancelAtPeriodEnd,
      },
    };
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    return {
      hasSubscription: false,
      error: "Failed to load subscription details",
    };
  }
}

// Simple helper to check if user has an active subscription
export async function isUserSubscribed(): Promise<boolean> {
  const result = await getSubscriptionDetails();
  return result.hasSubscription && result.subscription?.status === "active";
}

// Helper to check if user has access to a specific price/tier
export async function hasAccessToPrice(priceId: string): Promise<boolean> {
  const result = await getSubscriptionDetails();
  return (
    result.hasSubscription &&
    result.subscription?.status === "active" &&
    result.subscription?.priceId === priceId
  );
}

// Helper to get user's current subscription status
export async function getUserSubscriptionStatus(): Promise<"active" | "canceled" | "expired" | "none"> {
  const result = await getSubscriptionDetails();
  
  if (!result.hasSubscription) {
    return "none";
  }
  
  const status = result.subscription?.status;
  
  if (status === "active") {
    return "active";
  }
  
  if (status === "canceled") {
    return "canceled";
  }
  
  // Check if expired (past due, unpaid, etc.)
  if (status === "past_due" || status === "unpaid" || status === "incomplete_expired") {
    return "expired";
  }
  
  return "none";
}