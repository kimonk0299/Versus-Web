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
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-surface-variant via-background to-background">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            className="text-5xl font-fredoka font-bold text-primary mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {roundName}
          </motion.h1>
          <p className="text-xl text-foreground/70 font-nunito">
            Match {bracketState.currentMatchup + 1} of {totalMatchups}
          </p>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto mt-4 bg-surface-variant rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-secondary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Matchup */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <MovieCard
              movie={currentMatchup.movie1}
              onClick={() => pickWinner(currentMatchup.movie1)}
            />
          </motion.div>

          <div className="flex items-center justify-center md:hidden">
            <div className="text-4xl font-fredoka font-bold text-secondary">
              VS
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <MovieCard
              movie={currentMatchup.movie2}
              onClick={() => pickWinner(currentMatchup.movie2)}
            />
          </motion.div>
        </div>

        {/* VS Badge (desktop) */}
        <div className="hidden md:flex justify-center -mt-64 mb-64">
          <div className="bg-secondary text-white w-20 h-20 rounded-full flex items-center justify-center text-2xl font-fredoka font-bold shadow-lg">
            VS
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center mt-8 text-foreground/60">
          <p className="font-nunito">Click on your favorite movie to advance it!</p>
        </div>
      </div>
    </div>
  );
}
