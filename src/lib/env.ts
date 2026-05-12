export const env = {
  // NextAuth
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'hydravoice-dev-secret-change-in-production',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',

  // Google OAuth
  GOOGLE_ID: process.env.GOOGLE_ID || 'placeholder-google-client-id',
  GOOGLE_SECRET: process.env.GOOGLE_SECRET || 'placeholder-google-client-secret',

  // Microsoft OAuth
  MICROSOFT_ID: process.env.MICROSOFT_ID || 'placeholder-microsoft-client-id',
  MICROSOFT_SECRET: process.env.MICROSOFT_SECRET || 'placeholder-microsoft-client-secret',

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_stripe_key',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder_webhook_secret',
  STRIPE_PRICE_STARTER: process.env.STRIPE_PRICE_STARTER || 'price_starter_placeholder',
  STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder',
  STRIPE_PRICE_ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_placeholder',

  // App
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'file:./db/database.sqlite',
} as const;

/** Check if we're running in development mode */
export const isDev = env.NODE_ENV === 'development';

/** Stripe price map by plan type */
export const STRIPE_PRICES: Record<string, string> = {
  starter: env.STRIPE_PRICE_STARTER,
  pro: env.STRIPE_PRICE_PRO,
  enterprise: env.STRIPE_PRICE_ENTERPRISE,
};

/** Plan prices in USD (for display and payment records) */
export const PLAN_PRICES: Record<string, number> = {
  starter: 9.99,
  pro: 24.99,
  enterprise: 49.99,
};
