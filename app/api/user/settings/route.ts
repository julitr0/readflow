import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db/drizzle';
import { userSettings } from '@/db/schema';
import { validateUserSettings } from '@/lib/validation';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    
    // Validate request data
    const validation = await validateUserSettings(request);
    if (validation instanceof NextResponse) {
      return validation; // Return validation error response
    }
    
    const { data: settings } = validation;
    const { kindleEmail, personalEmail, onboardingComplete } = settings;
    // Note: notificationsEnabled and autoDelivery would be used in full implementation

    // Generate personal email based on Kindle email username
    let finalPersonalEmail = personalEmail;
    if (!finalPersonalEmail && kindleEmail) {
      // Extract username from Kindle email (e.g., jctiusanen@kindle.com -> jctiusanen)
      const kindleUsername = kindleEmail.split('@')[0];
      finalPersonalEmail = `${kindleUsername}@linktoreader.com`;
    } else if (!finalPersonalEmail) {
      // Fallback to userId if no Kindle email provided
      finalPersonalEmail = `${userId.slice(0, 8)}@linktoreader.com`;
    }

    // Check if user settings exist
    const existingSettings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (existingSettings.length > 0) {
      // Update existing settings
      await db
        .update(userSettings)
        .set({
          kindleEmail: kindleEmail || null,
          personalEmail: finalPersonalEmail,
          onboardingComplete: onboardingComplete ?? existingSettings[0].onboardingComplete,
          conversionPreferences: settings.conversionPreferences || null,
          notificationPreferences: settings.notificationPreferences || null,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, userId));
    } else {
      // Create new settings
      await db.insert(userSettings).values({
        id: crypto.randomUUID(),
        userId,
        kindleEmail: kindleEmail || null,
        personalEmail: finalPersonalEmail,
        onboardingComplete: onboardingComplete ?? false,
        conversionPreferences: settings.conversionPreferences || null,
        notificationPreferences: settings.notificationPreferences || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Check authentication
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;

    // Get user settings
    const settings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    return NextResponse.json({
      success: true,
      settings: settings[0] || null
    });

  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}