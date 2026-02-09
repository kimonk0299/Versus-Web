'use client';

import { useRouter } from 'next/navigation';
import { use } from 'react';
import { useBracketStore } from '@/stores/bracketStore';
import ConfettiAnimation from '@/components/ConfettiAnimation';
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
    router.push('/');
    return null;
  }

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

        {/* Movie Poster */}
        {bracketState.champion.posterPath && (
          <motion.div
            className="mb-6 flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 100,
              damping: 15,
              delay: 0.4
            }}
          >
            <img
              src={`https://image.tmdb.org/t/p/w500${bracketState.champion.posterPath}`}
              alt={bracketState.champion.title}
              className="rounded-2xl shadow-2xl w-48"
              style={{ aspectRatio: '2/3' }}
            />
          </motion.div>
        )}

        {/* Movie Title and Subtitle */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-3xl font-fredoka font-bold text-foreground mb-2">
            {bracketState.champion.title}
          </h2>
          <p className="text-lg text-foreground/70 font-nunito">
            is the ultimate winner!
          </p>
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
            onClick={() => {
              // Navigate to bracket view (we'll need to pass actor ID)
              // For now, just show an alert
              alert('Bracket view coming soon for single player!');
            }}
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
