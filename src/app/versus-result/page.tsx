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

  const totalMatches = wins1 + wins2;
  const winnerWins = winner === actor1 ? wins1 : wins2;
  const loserWins = winner === actor1 ? wins2 : wins1;
  const loser = winner === actor1 ? actor2 : actor1;

  return (
    <div className="min-h-screen flex flex-col justify-center p-4 bg-gradient-to-br from-primary/20 via-background to-secondary/20 relative overflow-hidden">
      <ConfettiAnimation />

      <div className="w-full relative z-10">
        {/* Trophy Icon */}
        <motion.div
          className="text-center mb-8"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.2,
          }}
        >
          <div className="text-8xl mb-4">🏆</div>
        </motion.div>

        {/* Winner Announcement */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-5xl font-fredoka font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {winner} WINS!
            </span>
          </h1>
          <p className="text-2xl text-foreground/70 font-nunito">
            {winner} dominated the battle!
          </p>
        </motion.div>

        {/* Score Breakdown */}
        <motion.div
          className="bg-white rounded-2xl p-8 shadow-xl mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-2xl font-fredoka font-semibold text-center mb-6">
            Final Score
          </h2>

          <div className="space-y-4">
            {/* Winner Score */}
            <div
              className={`flex items-center justify-between p-4 rounded-xl ${
                winner === actor1 ? 'bg-primary/10' : 'bg-secondary/10'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">👑</div>
                <span className="text-xl font-nunito font-bold text-foreground">
                  {winner}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-4xl font-fredoka font-bold text-primary">
                  {winnerWins}
                </span>
                <span className="text-foreground/60 font-nunito">
                  / {totalMatches}
                </span>
              </div>
            </div>

            {/* Loser Score */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-foreground/5">
              <span className="text-xl font-nunito font-bold text-foreground/70">
                {loser}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-4xl font-fredoka font-bold text-foreground/50">
                  {loserWins}
                </span>
                <span className="text-foreground/60 font-nunito">
                  / {totalMatches}
                </span>
              </div>
            </div>
          </div>

          {/* Win Percentage */}
          <div className="mt-6 pt-6 border-t border-foreground/10">
            <div className="text-center">
              <p className="text-sm text-foreground/60 font-nunito mb-2">
                Win Rate
              </p>
              <p className="text-3xl font-fredoka font-bold text-primary">
                {((winnerWins / totalMatches) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </motion.div>

        {/* Play Again Button */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <button
            onClick={handlePlayAgain}
            className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-fredoka font-bold text-xl hover:shadow-2xl hover:scale-105 transition-all"
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
