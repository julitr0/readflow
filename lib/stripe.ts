import Stripe from 'stripe';

// Only initialize Stripe if the secret key is available
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.acacia',
    typescript: true,
  });
}

export { stripe };

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  priceIds: {
    starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID!,
    pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
  },
};

// Helper to create checkout session
export async function createCheckoutSession({
  priceId,
  userId,
  userEmail,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
  if (!stripe) {
    throw new Error('Stripe is not initialized. Please check STRIPE_SECRET_KEY environment variable.');
  }
  
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: userEmail,
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
  });
}

// Helper to create billing portal session
export async function createBillingPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  if (!stripe) {
    throw new Error('Stripe is not initialized. Please check STRIPE_SECRET_KEY environment variable.');
  }
  
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

// Helper to verify webhook signature
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  if (!stripe) {
    throw new Error('Stripe is not initialized. Please check STRIPE_SECRET_KEY environment variable.');
  }
  
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

// Helper to get subscription status
export async function getSubscriptionStatus(customerId: string) {
  if (!stripe) {
    throw new Error('Stripe is not initialized. Please check STRIPE_SECRET_KEY environment variable.');
  }
  
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    return null;
  }

  const subscription = subscriptions.data[0];
  return {
    id: subscription.id,
    status: subscription.status,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    priceId: subscription.items.data[0]?.price.id,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
}

// Helper to cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not initialized. Please check STRIPE_SECRET_KEY environment variable.');
  }
  
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

// Helper to resume subscription
export async function resumeSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not initialized. Please check STRIPE_SECRET_KEY environment variable.');
  }
  
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}