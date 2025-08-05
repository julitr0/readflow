import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { createCheckoutSession } from '@/lib/stripe';
import { logger, getCorrelationId } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const context = logger.createContext('stripe-checkout', undefined, { correlationId });
  
  try {
    logger.info('Stripe checkout request received', context);
    
    // Check authentication
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId || !result?.user?.email) {
      logger.warn('Unauthorized checkout attempt', context);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId } = await request.json();
    
    if (!priceId) {
      logger.warn('Missing priceId in checkout request', context);
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    const userId = result.session.userId;
    const userEmail = result.user.email;
    
    context.userId = userId;
    logger.info('Creating Stripe checkout session', { 
      ...context, 
      metadata: { priceId, userEmail } 
    });

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      priceId,
      userId,
      userEmail,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    });

    logger.info('Stripe checkout session created successfully', { 
      ...context, 
      metadata: { sessionId: session.id } 
    });

    return NextResponse.json({ 
      sessionId: session.id,
      sessionUrl: session.url 
    });

  } catch (error) {
    logger.error('Stripe checkout failed', context, error as Error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}