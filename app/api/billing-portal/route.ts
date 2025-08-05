import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { createBillingPortalSession } from '@/lib/stripe';
import { db } from '@/db/drizzle';
import { userSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger, getCorrelationId } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const context = logger.createContext('stripe-billing-portal', undefined, { correlationId });
  
  try {
    logger.info('Billing portal request received', context);
    
    // Check authentication
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      logger.warn('Unauthorized billing portal attempt', context);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    context.userId = userId;
    
    // Get user's Stripe customer ID
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (!settings?.stripeCustomerId) {
      logger.warn('No Stripe customer ID found for user', context);
      return NextResponse.json({ 
        error: 'No subscription found. Please subscribe first.' 
      }, { status: 400 });
    }

    logger.info('Creating billing portal session', { 
      ...context, 
      metadata: { customerId: settings.stripeCustomerId } 
    });

    // Create billing portal session
    const session = await createBillingPortalSession({
      customerId: settings.stripeCustomerId,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    logger.info('Billing portal session created successfully', { 
      ...context, 
      metadata: { sessionId: session.id } 
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    logger.error('Billing portal creation failed', context, error as Error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}