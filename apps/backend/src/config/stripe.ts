import Stripe from 'stripe';
import logger from '../utils/logger';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

if (!stripeSecretKey) {
  logger.warn('Stripe SECRET_KEY is not defined. Payments will fallback to mock testing models.');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-04-10' as any, // Cast to any to bypass strict type bindings if versions differ slightly
});

logger.info('Stripe SDK initialized.');

export default stripe;
