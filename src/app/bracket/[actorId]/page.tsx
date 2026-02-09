'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useBracketStore } from '@/stores/bracketStore';
import MovieCard from '@/components/MovieCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getRoundName } from '@/lib/bracket/algorithm';
import { motion } from 'framer-motion';

export default function BracketPage({
  params,
}: {
  params: Promise<{ actorId: string }>;
}) {
  const { actorId } = use(params);
  const router = useRouter();
  const { bracketState, isLoading, error, loadSingleActor, pickWinner } =
    useBracketStore();

  useEffect(() => {
    const id = parseInt(actorId, 10);
    if (!isNaN(id)) {
      loadSingleActor(id);
    }
  }, [actorId, loadSingleActor]);

  useEffect(() => {
    // Check if tournament is complete
    if (bracketState?.isComplete && bracketState.champion) {
      router.push(`/winner/${bracketState.champion.id}`);
    }
  }, [bracketState, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl text-center">
          <h2 className="text-2xl font-fredoka font-bold text-secondary mb-4">
            Error
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

  if (!bracketState || bracketState.rounds.length === 0) {
    return <LoadingSpinner />;
  }

  const currentRound = bracketState.rounds[bracketState.currentRound];
  const currentMatchup = currentRound[bracketState.currentMatchup];

  if (!currentMatchup) {
    return <LoadingSpinner />;
  }

  const roundName = getRoundName(currentRound.length);
  const totalMatchups = currentRound.length;
  const progress = ((bracketState.currentMatchup + 1) / totalMatchups) * 100;

  return (
    <div className="h-screen flex flex-col py-3 px-4 bg-background overflow-y-auto">
      {/* Header - Compact */}
      <div className="text-center mb-3 flex-shrink-0">
        <motion.h1
          className="text-2xl font-fredoka font-bold text-primary mb-1"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {roundName}
        </motion.h1>
        <p className="text-xs text-foreground/60 font-nunito">
          Match {bracketState.currentMatchup + 1} of {totalMatchups}
        </p>
      </div>

      <div className="text-center mb-3 flex-shrink-0">
        <p className="font-nunito text-sm text-foreground/70 font-medium">Tap your pick!</p>
      </div>

      {/* Matchup - Large posters */}
      <div className="flex-1 flex flex-col justify-center gap-2 mx-auto w-full max-w-[320px]">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full"
          style={{ maxHeight: '45%' }}
        >
          <MovieCard
            movie={currentMatchup.movie1}
            onClick={() => pickWinner(currentMatchup.movie1)}
          />
        </motion.div>

        <div className="flex items-center justify-center flex-shrink-0">
          <div className="bg-primary text-white px-6 py-1.5 rounded-full text-xl font-fredoka font-bold shadow-lg">
            VS
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full"
          style={{ maxHeight: '45%' }}
        >
          <MovieCard
            movie={currentMatchup.movie2}
            onClick={() => pickWinner(currentMatchup.movie2)}
          />
        </motion.div>
      </div>
    </div>
  );
}
