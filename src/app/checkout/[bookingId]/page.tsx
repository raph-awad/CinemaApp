import { Suspense } from 'react';
import CheckoutClient from './CheckoutClient';

export function generateStaticParams() {
  return [{ bookingId: 'default' }, { bookingId: 'demo' }];
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08090d] flex items-center justify-center text-zinc-400">
          Loading checkout session...
        </div>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}
