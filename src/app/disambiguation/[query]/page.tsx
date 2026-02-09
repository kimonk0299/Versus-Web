'use client';

import { useEffect, use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDisambiguationStore } from '@/stores/disambiguationStore';
import ActorResultCard from '@/components/ActorResultCard';
import LoadingSpinner from '@/components/LoadingSpinner';

function DisambiguationContent({ query }: { query: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { results, isLoading, error, searchActors } = useDisambiguationStore();

  const decodedQuery = decodeURIComponent(query);
  const mode = searchParams.get('mode');
  const actor1Id = searchParams.get('actor1');
  const nextStep = searchParams.get('next');
  const count = searchParams.get('count') || '16';

  useEffect(() => {
    searchActors(decodedQuery);
  }, [decodedQuery, searchActors]);

  const handleSelectActor = (actorId: number) => {
    if (mode === 'versus') {
      if (nextStep === 'actor2') {
        // This was actor1 disambiguation, now navigate back to home or to actor2 disambiguation
        router.push(`/?mode=versus&actor1=${actorId}&count=${count}`);
      } else if (actor1Id) {
        // This was actor2 disambiguation, now go to bracket
        router.push(`/bracket/${actor1Id}/vs/${actorId}?count=${count}`);
      }
    } else {
      // Single actor mode
      router.push(`/bracket/${actorId}?count=${count}`);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl text-center">
          <h2 className="text-2xl font-fredoka font-bold text-secondary mb-4">
            Oops!
          </h2>
          <p className="text-foreground/70 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-primary text-white rounded-xl font-nunito font-bold hover:shadow-lg transition-all"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-surface-variant via-background to-background">
      <div className="w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-fredoka font-bold text-primary mb-2">
            Which {decodedQuery}?
          </h1>
          <p className="text-lg text-foreground/70">
            We found multiple actors with that name. Pick the right one:
          </p>
        </div>

        {/* Results */}
        {results.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
            <p className="text-lg text-foreground/70 mb-4">
              No actors found for &quot;{decodedQuery}&quot;
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-primary text-white rounded-xl font-nunito font-bold hover:shadow-lg transition-all"
            >
              Try Another Search
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {results.map((actor) => (
              <ActorResultCard
                key={actor.id}
                actor={actor}
                onClick={() => handleSelectActor(actor.id)}
              />
            ))}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-primary font-nunito font-semibold hover:underline"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DisambiguationPage({
  params,
}: {
  params: Promise<{ query: string }>;
}) {
  const { query } = use(params);
  const decodedQuery = decodeURIComponent(query);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DisambiguationContent query={decodedQuery} />
    </Suspense>
  );
}
