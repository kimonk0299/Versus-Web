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
    <div className="h-screen flex flex-col p-3 bg-gradient-to-br from-surface-variant via-background to-background overflow-hidden">
      {/* Header with Score - Compact */}
      <div className="text-center mb-3">
        <motion.h1
          className="text-xl font-fredoka font-bold text-primary mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {versusBracketState.actor1Name} vs {versusBracketState.actor2Name}
        </motion.h1>

        {/* Score Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs font-nunito font-semibold text-foreground/70 mb-1 px-2">
            <span className="truncate">{versusBracketState.actor1Name}</span>
            <span className="text-[10px]">
              {versusBracketState.currentMatchup + 1}/{totalMatchups}
            </span>
            <span className="truncate">{versusBracketState.actor2Name}</span>
          </div>

          <div className="flex h-8 rounded-xl overflow-hidden shadow-md">
            <motion.div
              className="bg-primary flex items-center justify-center text-white font-nunito font-bold text-sm"
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
              className="bg-secondary flex items-center justify-center text-white font-nunito font-bold text-sm"
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

      {/* Matchup - Fits on screen */}
      <div className="flex-1 flex flex-col justify-center gap-2 max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1"
        >
          <div className="mb-1 text-center">
            <span className="inline-block px-3 py-1 bg-primary/20 text-primary font-nunito font-semibold rounded-lg text-xs">
              {versusBracketState.actor1Name}
            </span>
          </div>
          <MovieCard
            movie={currentMatchup.movie1}
            onClick={() => pickWinner(currentMatchup.movie1)}
          />
        </motion.div>

        <div className="flex items-center justify-center py-1">
          <div className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-1 rounded-full text-xl font-fredoka font-bold shadow-lg">
            VS
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1"
        >
          <div className="mb-1 text-center">
            <span className="inline-block px-3 py-1 bg-secondary/20 text-secondary font-nunito font-semibold rounded-lg text-xs">
              {versusBracketState.actor2Name}
            </span>
          </div>
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
