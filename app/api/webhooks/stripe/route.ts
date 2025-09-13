import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, STRIPE_CONFIG } from '@/lib/stripe';
import { db } from '@/db/drizzle';
import { userSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger, getCorrelationId } from '@/lib/logger';
import type Stripe from 'stripe';

// Extended Stripe subscription type with missing properties
interface StripeSubscriptionWithPeriod extends Stripe.Subscription {
  current_period_end: number;
}

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const context = logger.createContext('stripe-webhook', undefined, { correlationId });
  
  try {
    logger.info('Stripe webhook received', context);
    
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      logger.warn('Missing Stripe signature header', context);
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body, signature, STRIPE_CONFIG.webhookSecret);
    } catch (error) {
      logger.error('Webhook signature verification failed', context, error as Error);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    logger.info('Processing Stripe webhook event', {
      ...context,
      metadata: { eventType: event.type, eventId: event.id }
    });

    // Handle different webhook events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, context);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription, context);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, context);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, context);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, context);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, context);
        break;
        
      default:
        logger.info('Unhandled webhook event type', {
          ...context,
          metadata: { eventType: event.type }
        });
    }

    logger.info('Stripe webhook processed successfully', context);
    return NextResponse.json({ received: true });

  } catch (error) {
    logger.error('Stripe webhook processing failed', context, error as Error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  context: { correlationId: string; userId?: string; operation: string; metadata?: Record<string, unknown> }
) {
  const userId = session.metadata?.userId;
  if (!userId) {
    logger.warn('No userId in checkout session metadata', context);
    return;
  }

  logger.info('Processing checkout completion', {
    ...context,
    userId,
    metadata: { sessionId: session.id, customerId: session.customer }
  });

  // Update user settings with Stripe customer ID
  await db
    .update(userSettings)
    .set({
      stripeCustomerId: session.customer as string,
      subscriptionStatus: 'active',
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, userId));
}

async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  context: { correlationId: string; userId?: string; operation: string; metadata?: Record<string, unknown> }
) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    logger.warn('No userId in subscription metadata', context);
    return;
  }

  logger.info('Processing subscription creation', {
    ...context,
    userId,
    metadata: { subscriptionId: subscription.id, status: subscription.status }
  });

  await db
    .update(userSettings)
    .set({
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionPriceId: subscription.items.data[0]?.price.id,
      subscriptionCurrentPeriodEnd: new Date((subscription as StripeSubscriptionWithPeriod).current_period_end * 1000),
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, userId));
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  context: { correlationId: string; userId?: string; operation: string; metadata?: Record<string, unknown> }
) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    logger.warn('No userId in subscription metadata', context);
    return;
  }

  logger.info('Processing subscription update', {
    ...context,
    userId,
    metadata: { subscriptionId: subscription.id, status: subscription.status }
  });

  await db
    .update(userSettings)
    .set({
      subscriptionStatus: subscription.status,
      subscriptionPriceId: subscription.items.data[0]?.price.id,
      subscriptionCurrentPeriodEnd: new Date((subscription as StripeSubscriptionWithPeriod).current_period_end * 1000),
      subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, userId));
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  context: { correlationId: string; userId?: string; operation: string; metadata?: Record<string, unknown> }
) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    logger.warn('No userId in subscription metadata', context);
    return;
  }

  logger.info('Processing subscription deletion', {
    ...context,
    userId,
    metadata: { subscriptionId: subscription.id }
  });

  await db
    .update(userSettings)
    .set({
      subscriptionStatus: 'canceled',
      stripeSubscriptionId: null,
      subscriptionPriceId: null,
      subscriptionCurrentPeriodEnd: null,
      subscriptionCancelAtPeriodEnd: false,
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, userId));
}

async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
  context: { correlationId: string; userId?: string; operation: string; metadata?: Record<string, unknown> }
) {
  logger.info('Payment succeeded', {
    ...context,
    metadata: { invoiceId: invoice.id, customerId: invoice.customer }
  });
  
  // You can add additional logic here, such as:
  // - Sending confirmation emails
  // - Updating usage limits
  // - Analytics tracking
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  context: { correlationId: string; userId?: string; operation: string; metadata?: Record<string, unknown> }
) {
  logger.warn('Payment failed', {
    ...context,
    metadata: { invoiceId: invoice.id, customerId: invoice.customer }
  });
  
  // You can add additional logic here, such as:
  // - Sending payment failure notifications
  // - Downgrading subscription tiers
  // - Setting grace periods
}