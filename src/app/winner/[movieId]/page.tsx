'use client';

import { useRouter } from 'next/navigation';
import { use } from 'react';
import { useBracketStore } from '@/stores/bracketStore';
import ConfettiAnimation from '@/components/ConfettiAnimation';
import MovieCard from '@/components/MovieCard';
import { motion } from 'framer-motion';

export default function WinnerPage({
  params,
}: {
  params: Promise<{ movieId: string }>;
}) {
  const { movieId } = use(params);
  const router = useRouter();
  const { bracketState, reset } = useBracketStore();

  const handlePlayAgain = () => {
    reset();
    router.push('/');
  };

  if (!bracketState?.champion) {
    // If there's no champion, redirect to home
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-primary/20 via-background to-secondary/20 relative overflow-hidden">
      <ConfettiAnimation />

      <div className="max-w-2xl w-full relative z-10">
        {/* Trophy/Crown Icon */}
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
          <div className="text-8xl mb-4">👑</div>
        </motion.div>

        {/* Winner Title */}
        <motion.h1
          className="text-6xl font-fredoka font-bold text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            CHAMPION!
          </span>
        </motion.h1>

        {/* Winner Movie Card */}
        <motion.div
          className="max-w-sm mx-auto mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 150,
            damping: 12,
            delay: 0.6,
          }}
        >
          <MovieCard movie={bracketState.champion} />
        </motion.div>

        {/* Movie Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="text-3xl font-fredoka font-bold text-foreground mb-2">
            {bracketState.champion.title}
          </h2>
          {bracketState.champion.releaseYear > 0 && (
            <p className="text-xl text-foreground/70">
              {bracketState.champion.releaseYear}
            </p>
          )}
        </motion.div>

        {/* Play Again Button */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
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
