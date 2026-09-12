import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia' as unknown as Stripe.LatestApiVersion,
      typescript: true,
    })
  : null;

export const isStripeConfigured = !!stripeSecretKey;

export interface CreatePaymentSessionParams {
  bookingId: string;
  bookingReference: string;
  amountInCents: number;
  currency?: string;
  customerEmail: string;
  customerName: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(params: CreatePaymentSessionParams) {
  if (!stripe) {
    // Return sandbox checkout URL indicator
    return {
      id: `mock_cs_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      url: `/checkout/${params.bookingId}?sandbox_payment=true`,
      isMock: true,
    };
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: params.customerEmail,
    line_items: [
      {
        price_data: {
          currency: params.currency || 'usd',
          product_data: {
            name: `CineBook Reservation: ${params.bookingReference}`,
            description: `Cinema Ticket Booking #${params.bookingReference}`,
          },
          unit_amount: params.amountInCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      bookingId: params.bookingId,
      bookingReference: params.bookingReference,
    },
    success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: params.cancelUrl,
  });

  return {
    id: session.id,
    url: session.url,
    isMock: false,
  };
}
