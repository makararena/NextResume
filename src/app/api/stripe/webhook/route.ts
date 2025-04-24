import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import Stripe from "stripe";

const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!webhookSecret || !signature) {
      throw new Error("Missing Stripe webhook secret or signature");
    }
    
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case "checkout.session.completed":
          const checkoutSession = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutSessionCompleted(checkoutSession);
          break;
        case "customer.subscription.created":
        case "customer.subscription.updated":
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdated(subscription);
          break;
        case "customer.subscription.deleted":
          const deletedSubscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionDeleted(deletedSubscription);
          break;
        default:
          throw new Error(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`Error handling webhook event: ${error}`);
      return NextResponse.json(
        { error: "Webhook handler failed" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId;
  const stripeCustomerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (userId && subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const price = subscription.items.data[0].price;
    const priceId = price.id;

    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

    // Update user subscription in database
    await db.userSubscription.upsert({
      where: { userId },
      update: {
        plan: "premium",
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        stripeCurrentPeriodEnd: currentPeriodEnd,
        stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      create: {
        userId,
        plan: "premium",
        stripeCustomerId,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        stripeCurrentPeriodEnd: currentPeriodEnd,
        stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Find user by Stripe customer ID
  const userSubscription = await db.userSubscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!userSubscription) {
    console.error(`No user found with Stripe customer ID: ${customerId}`);
    return;
  }

  const price = subscription.items.data[0].price;
  const priceId = price.id;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  // Update user subscription in database
  await db.userSubscription.update({
    where: { id: userSubscription.id },
    data: {
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: currentPeriodEnd,
      stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Find user by Stripe customer ID
  const userSubscription = await db.userSubscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!userSubscription) {
    console.error(`No user found with Stripe customer ID: ${customerId}`);
    return;
  }

  // Set user back to free tier
  await db.userSubscription.update({
    where: { id: userSubscription.id },
    data: {
      plan: "free",
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
    },
  });
} 