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
    <div className="h-screen flex flex-col p-3 bg-gradient-to-br from-surface-variant via-background to-background overflow-hidden">
      {/* Header - Compact */}
      <div className="text-center mb-3">
        <motion.h1
          className="text-2xl font-fredoka font-bold text-primary mb-1"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {roundName}
        </motion.h1>
        <p className="text-sm text-foreground/70 font-nunito mb-2">
          Match {bracketState.currentMatchup + 1} of {totalMatchups}
        </p>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto bg-surface-variant rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-secondary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Matchup - Fits on screen */}
      <div className="flex-1 flex flex-col justify-center gap-2 max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1"
        >
          <MovieCard
            movie={currentMatchup.movie1}
            onClick={() => pickWinner(currentMatchup.movie1)}
          />
        </motion.div>

        <div className="flex items-center justify-center py-1">
          <div className="bg-secondary text-white px-6 py-1 rounded-full text-xl font-fredoka font-bold shadow-lg">
            VS
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1"
        >
          <MovieCard
            movie={currentMatchup.movie2}
            onClick={() => pickWinner(currentMatchup.movie2)}
          />
        </motion.div>
      </div>

      {/* Instructions - Compact */}
      <div className="text-center py-2 text-foreground/60">
        <p className="font-nunito text-xs">Tap your favorite movie!</p>
      </div>
    </div>
  );
}
