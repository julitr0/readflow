import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db/drizzle';
import { conversion, userSettings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = result.session.userId;

    // Get the conversion record
    const [existingConversion] = await db
      .select()
      .from(conversion)
      .where(
        and(
          eq(conversion.id, id),
          eq(conversion.userId, userId)
        )
      )
      .limit(1);

    if (!existingConversion) {
      return NextResponse.json({ error: 'Conversion not found' }, { status: 404 });
    }

    if (existingConversion.status !== 'failed') {
      return NextResponse.json({ error: 'Can only retry failed conversions' }, { status: 400 });
    }

    // Get user settings for Kindle email
    const [userSetting] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (!userSetting?.kindleEmail) {
      return NextResponse.json({ error: 'Kindle email not configured' }, { status: 400 });
    }

    // Reset conversion status to pending
    await db
      .update(conversion)
      .set({
        status: 'pending',
        error: null,
        updatedAt: new Date(),
      })
      .where(eq(conversion.id, id));

    // Process retry asynchronously
    await processRetryAsync(id);

    return NextResponse.json({ 
      success: true, 
      message: 'Retry initiated' 
    });

  } catch (error) {
    console.error('Retry error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

async function processRetryAsync(conversionId: string) {
  try {
    // Get conversion details
    const [conversionData] = await db
      .select()
      .from(conversion)
      .where(eq(conversion.id, conversionId))
      .limit(1);

    if (!conversionData) {
      throw new Error('Conversion not found');
    }

    // For retry, we need the original email content
    // In a real implementation, you might store the original HTML
    // For now, we'll mark as failed since we don't have the original content
    throw new Error('Original content not available for retry. Please resend the email.');

  } catch (error) {
    console.error('Retry processing failed:', error);
    
    await db
      .update(conversion)
      .set({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Retry failed',
        updatedAt: new Date(),
      })
      .where(eq(conversion.id, conversionId));
  }
}