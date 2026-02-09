'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useBracketStore } from '@/stores/bracketStore';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';
import type { Matchup } from '@/lib/bracket/types';
import html2canvas from 'html2canvas';

export default function VersusBracketViewPage() {
  const router = useRouter();
  const bracketRef = useRef<HTMLDivElement>(null);
  const { versusBracketState } = useBracketStore();
  const [isSharing, setIsSharing] = useState(false);

  // Calculate wins from completed matchups if state doesn't have them
  const actor1Wins = versusBracketState?.actor1Wins || 0;
  const actor2Wins = versusBracketState?.actor2Wins || 0;
  const winnerName = versusBracketState?.winnerName ||
    (actor1Wins > actor2Wins ? versusBracketState?.actor1Name : versusBracketState?.actor2Name);

  const shareAsImage = async () => {
    if (!bracketRef.current) return;

    setIsSharing(true);
    try {
      const canvas = await html2canvas(bracketRef.current, {
        backgroundColor: '#FFF8F0',
        scale: 2,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], 'versus-bracket.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Versus Match History',
              text: 'Check out this head-to-head battle!',
            });
          } catch (err) {
            console.log('Share cancelled');
          }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'versus-bracket.png';
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (err) {
      console.error('Share error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  if (!versusBracketState) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-fredoka font-bold text-primary">
            Match History
          </h1>
          <button
            onClick={shareAsImage}
            disabled={isSharing}
            className="p-2 bg-primary text-white rounded-xl disabled:opacity-50"
          >
            {isSharing ? '⏳' : '📤'}
          </button>
        </div>

        {/* Bracket Content */}
        <div ref={bracketRef} className="bg-white rounded-2xl p-6 shadow-xl">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-xl font-fredoka font-bold">
                {versusBracketState.actor1Name} <span className="text-primary">VS</span> {versusBracketState.actor2Name}
              </h2>
              <p className="text-sm text-foreground/60 font-nunito mt-1">Head-to-Head Results</p>
            </div>

            {/* Matchups */}
            <div className="space-y-3">
              {versusBracketState.matchups.map((matchup, idx) => (
                <div key={idx}>
                  <p className="text-xs font-nunito text-foreground/40 mb-2 ml-1">Match {idx + 1}</p>
                  <MatchupCard matchup={matchup} />
                </div>
              ))}
            </div>

            {/* Final Score */}
            <div className="mt-8 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl p-6">
              <p className="text-sm font-nunito text-center mb-4 opacity-90">FINAL SCORE</p>
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-4xl font-fredoka font-bold">{actor1Wins}</p>
                  <p className="text-sm font-nunito mt-1">{versusBracketState.actor1Name}</p>
                </div>
                <div className="text-2xl font-fredoka">-</div>
                <div className="text-center">
                  <p className="text-4xl font-fredoka font-bold">{actor2Wins}</p>
                  <p className="text-sm font-nunito mt-1">{versusBracketState.actor2Name}</p>
                </div>
              </div>
              {winnerName && (
                <p className="text-center text-sm font-nunito mt-4 opacity-90">
                  🏆 {winnerName} Wins!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-fredoka font-bold px-12 py-4"
          >
            PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
}

function MatchupCard({ matchup }: { matchup: Matchup }) {
  const { movie1, movie2, winner } = matchup;

  return (
    <div className="bg-surface-variant rounded-xl p-3">
      <div className="flex gap-2">
        {/* Movie 1 */}
        <div className={`flex-1 p-3 rounded-lg transition-all ${
          winner?.id === movie1.id
            ? 'bg-primary/20 border-2 border-primary shadow-lg'
            : 'bg-white'
        }`}>
          <div className="flex items-start gap-2">
            {movie1.posterPath && (
              <img
                src={`https://image.tmdb.org/t/p/w92${movie1.posterPath}`}
                alt={movie1.title}
                className="w-12 h-18 rounded object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-nunito font-bold text-xs leading-tight line-clamp-2">{movie1.title}</p>
              <p className="text-xs text-foreground/60 mt-0.5">{movie1.releaseYear}</p>
            </div>
          </div>
        </div>

        {/* VS */}
        <div className="flex items-center px-1">
          <span className="text-xs font-fredoka font-bold text-foreground/40 rotate-90">VS</span>
        </div>

        {/* Movie 2 */}
        <div className={`flex-1 p-3 rounded-lg transition-all ${
          winner?.id === movie2.id
            ? 'bg-primary/20 border-2 border-primary shadow-lg'
            : 'bg-white'
        }`}>
          <div className="flex items-start gap-2">
            {movie2.posterPath && (
              <img
                src={`https://image.tmdb.org/t/p/w92${movie2.posterPath}`}
                alt={movie2.title}
                className="w-12 h-18 rounded object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-nunito font-bold text-xs leading-tight line-clamp-2">{movie2.title}</p>
              <p className="text-xs text-foreground/60 mt-0.5">{movie2.releaseYear}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
