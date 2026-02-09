'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useBracketStore } from '@/stores/bracketStore';
import MovieCard from '@/components/MovieCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';

export default function VersusBracketPage({
  params,
}: {
  params: Promise<{ actorId: string; actor2Id: string }>;
}) {
  const { actorId, actor2Id } = use(params);
  const router = useRouter();
  const { versusBracketState, isLoading, error, loadVersusActors, pickWinner } =
    useBracketStore();

  useEffect(() => {
    const id1 = parseInt(actorId, 10);
    const id2 = parseInt(actor2Id, 10);
    if (!isNaN(id1) && !isNaN(id2)) {
      loadVersusActors(id1, id2);
    }
  }, [actorId, actor2Id, loadVersusActors]);

  useEffect(() => {
    // Check if versus battle is complete
    if (versusBracketState?.isComplete) {
      router.push(
        `/versus-result?winner=${encodeURIComponent(
          versusBracketState.winnerName || ''
        )}&actor1=${encodeURIComponent(
          versusBracketState.actor1Name
        )}&actor2=${encodeURIComponent(
          versusBracketState.actor2Name
        )}&wins1=${versusBracketState.actor1Wins}&wins2=${
          versusBracketState.actor2Wins
        }`
      );
    }
  }, [versusBracketState, router]);

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

  if (!versusBracketState || versusBracketState.matchups.length === 0) {
    return <LoadingSpinner />;
  }

  const currentMatchup =
    versusBracketState.matchups[versusBracketState.currentMatchup];

  if (!currentMatchup) {
    return <LoadingSpinner />;
  }

  const totalMatchups = versusBracketState.matchups.length;
  const actor1WinPercent =
    ((versusBracketState.actor1Wins / (versusBracketState.currentMatchup || 1)) *
      100) || 0;
  const actor2WinPercent =
    ((versusBracketState.actor2Wins / (versusBracketState.currentMatchup || 1)) *
      100) || 0;

  return (
    <div className="min-h-screen flex flex-col justify-center p-4 bg-gradient-to-br from-surface-variant via-background to-background">
      <div className="w-full">
        {/* Header with Score */}
        <div className="text-center mb-8">
          <motion.h1
            className="text-4xl font-fredoka font-bold text-primary mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {versusBracketState.actor1Name} vs {versusBracketState.actor2Name}
          </motion.h1>

          {/* Score Bar */}
          <div className="max-w-2xl mx-auto mb-4">
            <div className="flex justify-between text-sm font-nunito font-semibold text-foreground/70 mb-2">
              <span>{versusBracketState.actor1Name}</span>
              <span>
                {versusBracketState.currentMatchup + 1} / {totalMatchups}
              </span>
              <span>{versusBracketState.actor2Name}</span>
            </div>

            <div className="flex h-10 rounded-xl overflow-hidden shadow-md">
              <motion.div
                className="bg-primary flex items-center justify-center text-white font-nunito font-bold"
                initial={{ width: '50%' }}
                animate={{
                  width:
                    versusBracketState.currentMatchup === 0
                      ? '50%'
                      : `${actor1WinPercent}%`,
                }}
                transition={{ duration: 0.5 }}
              >
                {versusBracketState.actor1Wins}
              </motion.div>
              <motion.div
                className="bg-secondary flex items-center justify-center text-white font-nunito font-bold"
                initial={{ width: '50%' }}
                animate={{
                  width:
                    versusBracketState.currentMatchup === 0
                      ? '50%'
                      : `${actor2WinPercent}%`,
                }}
                transition={{ duration: 0.5 }}
              >
                {versusBracketState.actor2Wins}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Matchup */}
        <div className="flex flex-col gap-4 max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-2 text-center">
              <span className="inline-block px-4 py-2 bg-primary/20 text-primary font-nunito font-semibold rounded-lg text-sm">
                {versusBracketState.actor1Name}
              </span>
            </div>
            <MovieCard
              movie={currentMatchup.movie1}
              onClick={() => pickWinner(currentMatchup.movie1)}
            />
          </motion.div>

          <div className="flex items-center justify-center py-2">
            <div className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-2 rounded-full text-2xl font-fredoka font-bold shadow-lg">
              VS
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-2 text-center">
              <span className="inline-block px-4 py-2 bg-secondary/20 text-secondary font-nunito font-semibold rounded-lg text-sm">
                {versusBracketState.actor2Name}
              </span>
            </div>
            <MovieCard
              movie={currentMatchup.movie2}
              onClick={() => pickWinner(currentMatchup.movie2)}
            />
          </motion.div>
        </div>

        {/* Instructions */}
        <div className="text-center mt-8 text-foreground/60">
          <p className="font-nunito">Click on your favorite movie!</p>
        </div>
      </div>
    </div>
  );
}
