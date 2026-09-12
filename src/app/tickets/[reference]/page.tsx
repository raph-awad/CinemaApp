import { Suspense } from 'react';
import TicketClient from './TicketClient';

export function generateStaticParams() {
  return [
    { reference: 'default' },
    { reference: 'demo' },
    { reference: 'CB-8941' },
    { reference: 'CB-1001' },
  ];
}

export default function TicketPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08090d] flex items-center justify-center text-zinc-400">
          Loading digital pass...
        </div>
      }
    >
      <TicketClient />
    </Suspense>
  );
}
