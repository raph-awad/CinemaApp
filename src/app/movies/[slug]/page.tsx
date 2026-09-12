import { Suspense } from 'react';
import MovieDetailsClient from './MovieDetailsClient';

export function generateStaticParams() {
  return [
    { slug: 'dune-part-two' },
    { slug: 'oppenheimer' },
    { slug: 'interstellar' },
    { slug: 'spider-man-across-the-spider-verse' },
    { slug: 'past-lives' },
    { slug: 'poor-things' },
  ];
}

export default function MovieDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08090d] flex items-center justify-center text-zinc-400">
          Loading movie details...
        </div>
      }
    >
      <MovieDetailsClient />
    </Suspense>
  );
}
