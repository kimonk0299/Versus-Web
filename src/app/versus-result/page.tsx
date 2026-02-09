'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBracketStore } from '@/stores/bracketStore';
import ConfettiAnimation from '@/components/ConfettiAnimation';
import { motion } from 'framer-motion';
import LoadingSpinner from '@/components/LoadingSpinner';

function VersusResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { reset } = useBracketStore();

  const winner = searchParams.get('winner') || 'Winner';
  const actor1 = searchParams.get('actor1') || 'Actor 1';
  const actor2 = searchParams.get('actor2') || 'Actor 2';
  const wins1 = parseInt(searchParams.get('wins1') || '0', 10);
  const wins2 = parseInt(searchParams.get('wins2') || '0', 10);

  const handlePlayAgain = () => {
    reset();
    router.push('/');
  };

  const winnerWins = winner === actor1 ? wins1 : wins2;
  const loserWins = winner === actor1 ? wins2 : wins1;
  const loser = winner === actor1 ? actor2 : actor1;

  return (
    <div className="min-h-screen flex flex-col justify-center p-4 bg-gradient-to-br from-primary/20 via-background to-secondary/20 relative overflow-hidden">
      <ConfettiAnimation />

      <div className="w-full relative z-10 max-w-md mx-auto">
        {/* Winner Announcement */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-6xl font-fredoka font-black mb-4 text-primary">
            CHAMPION
          </h1>
        </motion.div>

        {/* Winner Name and Subtitle */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-5xl font-fredoka font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {winner}
            </span>
          </h1>
          <p className="text-lg text-foreground/70 font-nunito">
            is the ultimate winner!
          </p>
        </motion.div>

        {/* Score Display */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="inline-block bg-gradient-to-r from-primary to-secondary text-white rounded-2xl px-8 py-6 shadow-2xl">
            <p className="text-sm font-nunito mb-3 opacity-90">Final Score</p>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-5xl font-fredoka font-black">{winnerWins}</p>
                <p className="text-xs font-nunito mt-1 opacity-90">{winner}</p>
              </div>
              <div className="text-3xl font-fredoka opacity-60">-</div>
              <div className="text-center">
                <p className="text-5xl font-fredoka font-black opacity-60">{loserWins}</p>
                <p className="text-xs font-nunito mt-1 opacity-60">{loser}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {/* View Bracket Button */}
          <button
            onClick={() => router.push('/versus-bracket-view')}
            className="w-full max-w-md bg-white text-primary border-2 border-primary rounded-xl font-fredoka font-bold text-lg px-12 py-4 hover:bg-primary hover:text-white hover:shadow-xl transition-all"
          >
            📊 VIEW BRACKET
          </button>

          {/* Play Again Button */}
          <button
            onClick={handlePlayAgain}
            className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-fredoka font-bold text-xl px-12 py-4 hover:shadow-2xl hover:scale-105 transition-all"
          >
            PLAY AGAIN
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default function VersusResultPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <VersusResultContent />
    </Suspense>
  );
}
