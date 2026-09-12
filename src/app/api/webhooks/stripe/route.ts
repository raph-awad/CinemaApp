import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { BookingService } from '@/services/booking.service';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event | { type: string; data: { object: Record<string, unknown> } };

  // If real Stripe secret and signature exist, verify with Stripe SDK
  if (stripe && webhookSecret && signature) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid signature';
      console.error('❌ [Stripe Webhook] Signature verification failed:', msg);
      return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
    }
  } else {
    // Parse JSON directly for sandbox test mode or simulated webhook delivery
    try {
      event = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
      const session = event.data.object as Record<string, unknown>;
      const metadata = (session.metadata || {}) as Record<string, string>;
      const bookingId = metadata.bookingId || (session.bookingId as string);

      if (!bookingId) {
        console.warn('⚠️ [Stripe Webhook] Event missing bookingId in metadata.');
        return NextResponse.json({ received: true, note: 'No bookingId' });
      }

      const paymentIntentId = (session.id as string) || `pi_${Date.now()}`;
      const amountInCents = Number(session.amount_total || session.amount || 0);
      const idempotencyKey = `pay_webhook_${session.id || bookingId}`;

      const result = await BookingService.confirmPayment({
        bookingId,
        paymentIntentId,
        provider: stripe ? 'STRIPE' : 'MOCK_SANDBOX',
        idempotencyKey,
        amountInCents,
        metadata: {
          eventId: (event as { id?: string }).id,
          stripeSessionId: session.id,
        },
      });

      return NextResponse.json({
        received: true,
        isDuplicate: result.isDuplicate,
        bookingReference: result.booking?.bookingReference,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('❌ [Stripe Webhook] Error processing event:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
