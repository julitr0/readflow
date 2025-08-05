import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/db/drizzle';
import { userSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { KindleSettingsForm } from './_components/kindle-settings-form';

export default async function SettingsPage() {
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

  return (
    <section className="flex flex-col items-start justify-start p-4 md:p-6 w-full max-w-4xl mx-auto">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-center gap-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Configure your ReadFlow account and Kindle integration.
          </p>
        </div>

        {/* Kindle Settings */}
        <KindleSettingsForm 
          userId={userId}
          currentSettings={userSetting[0]}
        />
      </div>
    </section>
  );
}
