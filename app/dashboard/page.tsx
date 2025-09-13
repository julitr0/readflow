import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { conversion, userSettings, subscription } from "@/db/schema";
import { eq, desc, count, and, gte } from "drizzle-orm";
import { UsageCards } from "./_components/usage-cards";
import { RecentConversions } from "./_components/recent-conversions";
import { PersonalEmailCard } from "./_components/personal-email-card";

export default async function Dashboard() {
  const result = await auth.api.getSession({
    headers: await headers(),
  });

  if (!result?.session?.userId) {
    redirect("/sign-in");
  }

  const userId = result.session.userId;

  // Get user settings
  const userSetting = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  // Check if onboarding is complete
  if (!userSetting[0]?.onboardingComplete) {
    redirect("/onboarding");
  }

  // Get user subscription
  const userSubscription = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);

  // Get conversion stats
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const [monthlyConversions] = await db
    .select({ count: count() })
    .from(conversion)
    .where(
      and(
        eq(conversion.userId, userId),
        gte(conversion.createdAt, currentMonth)
      )
    );

  const [totalConversions] = await db
    .select({ count: count() })
    .from(conversion)
    .where(eq(conversion.userId, userId));

  // Get recent conversions
  const recentConversions = await db
    .select()
    .from(conversion)
    .where(eq(conversion.userId, userId))
    .orderBy(desc(conversion.createdAt))
    .limit(10);

  // Calculate subscription details
  const subscriptionTier = userSubscription[0]?.status === 'active' ? 'pro' : 'starter';
  const articlesLimit = subscriptionTier === 'pro' ? 300 : 100;
  const articlesUsed = monthlyConversions?.count || 0;

  return (
    <section className="flex flex-col items-start justify-start p-4 md:p-6 w-full max-w-7xl mx-auto">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-center gap-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor your article conversions and manage your Link to Reader account.
          </p>
        </div>

        {/* Personal Email Card */}
        <PersonalEmailCard 
          personalEmail={userSetting[0]?.personalEmail} 
          userId={userId}
        />

        {/* Usage Statistics */}
        <UsageCards
          articlesUsed={articlesUsed}
          articlesLimit={articlesLimit}
          totalConversions={totalConversions?.count || 0}
          subscriptionTier={subscriptionTier}
        />

        {/* Recent Conversions */}
        <RecentConversions conversions={recentConversions} />
      </div>
    </section>
  );
}
