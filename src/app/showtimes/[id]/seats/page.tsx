import { Suspense } from 'react';
import ShowtimeSeatsClient from './ShowtimeSeatsClient';

export function generateStaticParams() {
  return [
    { id: 'default' },
    { id: 'showtime-1' },
    { id: 'showtime-movie-1-1' },
    { id: 'showtime-movie-1-2' },
    { id: 'showtime-movie-1-3' },
    { id: 'showtime-movie-1-4' },
    { id: 'showtime-movie-2-1' },
    { id: 'showtime-movie-2-2' },
    { id: 'showtime-movie-2-3' },
    { id: 'showtime-movie-2-4' },
    { id: 'showtime-movie-3-1' },
    { id: 'showtime-movie-3-2' },
    { id: 'showtime-movie-4-1' },
    { id: 'showtime-movie-4-2' },
    { id: 'showtime-movie-5-1' },
    { id: 'showtime-movie-6-1' },
  ];
}

export default function ShowtimeSeatsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08090d] flex items-center justify-center text-zinc-400">
          Loading seating map...
        </div>
      }
    >
      <ShowtimeSeatsClient />
    </Suspense>
  );
}
