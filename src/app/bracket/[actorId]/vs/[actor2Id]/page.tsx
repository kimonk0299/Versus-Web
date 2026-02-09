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
  const progress = ((versusBracketState.currentMatchup) / totalMatchups) * 100;

  return (
    <div className="h-screen flex flex-col bg-background p-4">
      {/* Top Bar - Back button */}
      <div className="flex items-center mb-2 flex-shrink-0">
        <button
          onClick={() => router.push('/')}
          className="p-2 -ml-2"
        >
          <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="ml-2 text-xl font-nunito font-medium text-foreground">Head to Head</span>
      </div>

      {/* 8dp spacing */}
      <div className="h-2 flex-shrink-0" />

      {/* Versus Score Bar */}
      <div className="flex justify-between items-center flex-shrink-0">
        {/* Actor 1 score */}
        <div className="flex flex-col items-center">
          <span className="text-sm font-nunito text-foreground max-w-[100px] truncate">{versusBracketState.actor1Name}</span>
          <span className="text-4xl font-fredoka font-black text-primary">{versusBracketState.actor1Wins}</span>
        </div>

        <span className="text-base font-nunito font-medium text-foreground/50">VS</span>

        {/* Actor 2 score */}
        <div className="flex flex-col items-center">
          <span className="text-sm font-nunito text-foreground max-w-[100px] truncate">{versusBracketState.actor2Name}</span>
          <span className="text-4xl font-fredoka font-black text-primary">{versusBracketState.actor2Wins}</span>
        </div>
      </div>

      {/* 8dp spacing */}
      <div className="h-2 flex-shrink-0" />

      {/* Progress text */}
      <p className="text-center text-sm text-foreground/60 font-nunito flex-shrink-0">
        Match {versusBracketState.currentMatchup + 1} of {totalMatchups}
      </p>

      {/* 8dp spacing */}
      <div className="h-2 flex-shrink-0" />

      {/* Progress Bar - 4dp height */}
      <div className="h-1 bg-surface-variant rounded-full overflow-hidden flex-shrink-0">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* 16dp spacing */}
      <div className="h-4 flex-shrink-0" />

      {/* Tap your pick */}
      <p className="text-center text-base font-nunito font-medium text-foreground/70 flex-shrink-0">
        Tap your pick!
      </p>

      {/* 16dp spacing */}
      <div className="h-4 flex-shrink-0" />

      {/* Matchup - fills remaining space with gap-2 (8dp) between cards */}
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        {/* Movie 1 - weight(1f) equivalent */}
        <div className="flex-1 min-h-0">
          <motion.div
            className="h-full w-full"
            style={{ aspectRatio: '2/3' }}
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <MovieCard
              movie={currentMatchup.movie1}
              onClick={() => pickWinner(currentMatchup.movie1)}
            />
          </motion.div>
        </div>

        {/* VS text */}
        <div className="text-center flex-shrink-0">
          <span className="text-3xl font-fredoka font-black text-primary">VS</span>
        </div>

        {/* Movie 2 - weight(1f) equivalent */}
        <div className="flex-1 min-h-0">
          <motion.div
            className="h-full w-full"
            style={{ aspectRatio: '2/3' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <MovieCard
              movie={currentMatchup.movie2}
              onClick={() => pickWinner(currentMatchup.movie2)}
            />
          </motion.div>
        </div>
      </div>

      {/* 16dp bottom spacing */}
      <div className="h-4 flex-shrink-0" />
    </div>
  );
}
