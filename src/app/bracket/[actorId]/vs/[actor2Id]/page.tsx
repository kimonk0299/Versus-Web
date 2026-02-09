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
    <div className="h-screen flex flex-col p-4 bg-background overflow-hidden">
      {/* Header with Score - Compact */}
      <div className="mb-3">
        <motion.h1
          className="text-xl font-fredoka font-bold text-foreground mb-3 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Head to Head
        </motion.h1>

        {/* Score Bar */}
        <div className="mb-2">
          <div className="flex justify-between items-center mb-2 px-2">
            <div className="flex flex-col items-center">
              <span className="text-xs font-nunito text-foreground/70 truncate max-w-[120px]">{versusBracketState.actor1Name}</span>
              <span className="text-2xl font-fredoka font-bold text-primary">{versusBracketState.actor1Wins}</span>
            </div>
            <span className="text-lg font-fredoka font-bold text-foreground/50">VS</span>
            <div className="flex flex-col items-center">
              <span className="text-xs font-nunito text-foreground/70 truncate max-w-[120px]">{versusBracketState.actor2Name}</span>
              <span className="text-2xl font-fredoka font-bold text-primary">{versusBracketState.actor2Wins}</span>
            </div>
          </div>
          <p className="text-center text-xs text-foreground/60 font-nunito">
            Match {versusBracketState.currentMatchup + 1} of {totalMatchups}
          </p>
        </div>
      </div>

      <div className="text-center mb-3">
        <p className="font-nunito text-base text-foreground/70 font-medium">Tap your pick!</p>
      </div>

      {/* Matchup - Maintains 2:3 aspect ratio */}
      <div className="flex-1 flex flex-col justify-center gap-3 px-6 max-w-sm mx-auto w-full min-h-0">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          <MovieCard
            movie={currentMatchup.movie1}
            onClick={() => pickWinner(currentMatchup.movie1)}
          />
        </motion.div>

        <div className="flex items-center justify-center py-2">
          <div className="bg-primary text-white px-8 py-2 rounded-full text-2xl font-fredoka font-bold shadow-lg">
            VS
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full"
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
