import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { env, STRIPE_PRICES, PLAN_PRICES } from '@/lib/env';
import Stripe from 'stripe';

// Initialize Stripe with the secret key
function getStripe(): Stripe {
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body;

    // Validate plan type
    const validPlans = ['starter', 'pro', 'enterprise'];
    if (!plan || !validPlans.includes(plan)) {
      return NextResponse.json(
        { error: `Invalid plan type. Valid plans: ${validPlans.join(', ')}` },
        { status: 400 }
      );
    }

    const priceId = STRIPE_PRICES[plan];
    const amount = PLAN_PRICES[plan];

    if (!priceId || !amount) {
      return NextResponse.json(
        { error: 'Plan pricing not configured.' },
        { status: 500 }
      );
    }

    const stripe = getStripe();

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${env.APP_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.APP_URL}/pricing?payment=cancelled`,
      customer_email: session.user.email || undefined,
      metadata: {
        userId: session.user.id,
        plan: plan,
      },
    });

    // Create payment record in database
    await db.payments.create({
      data: {
        userId: session.user.id,
        stripeSessionId: checkoutSession.id,
        amount: amount,
        currency: 'usd',
        status: 'pending',
        plan: plan,
      },
    });

    return NextResponse.json({
      success: true,
      sessionUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment session. Please try again.' },
      { status: 500 }
    );
  }
}
