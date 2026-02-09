'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useBracketStore } from '@/stores/bracketStore';
import LoadingSpinner from '@/components/LoadingSpinner';
import BracketTree from '@/components/BracketTree';
import { motion } from 'framer-motion';
import type { Movie, Matchup } from '@/lib/bracket/types';
import html2canvas from 'html2canvas';

export default function BracketViewPage() {
  const router = useRouter();
  const bracketRef = useRef<HTMLDivElement>(null);
  const { bracketState } = useBracketStore();
  const [isSharing, setIsSharing] = useState(false);

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
              title: 'Tournament Bracket',
              text: 'Check out this tournament bracket!',
            });
          } catch (err) {
            console.log('Share cancelled');
          }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'tournament-bracket.png';
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

  if (!bracketState) {
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
            Tournament Bracket
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
          <BracketTree
            rounds={bracketState.rounds}
            championId={bracketState.champion?.id}
          />
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
