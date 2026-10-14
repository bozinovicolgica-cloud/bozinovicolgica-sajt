import 'server-only';
import Stripe from 'stripe';
import { stripeConfig } from './config';

let client: Stripe | null = null;

/** Stripe klijent; null dok STRIPE_SECRET_KEY nije podešen. */
export function stripe(): Stripe | null {
  if (client) return client;
  const { secretKey } = stripeConfig();
  if (!secretKey) return null;
  client = new Stripe(secretKey, { maxNetworkRetries: 2, timeout: 15_000 });
  return client;
}
