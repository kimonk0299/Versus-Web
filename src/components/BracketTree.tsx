'use client';

import { Matchup } from '@/lib/bracket/types';

interface BracketTreeProps {
  rounds: Matchup[][];
  championId?: number;
}

export default function BracketTree({ rounds, championId }: BracketTreeProps) {
  if (!rounds || rounds.length === 0) return null;

  return (
    <div className="relative overflow-x-auto pb-4">
      {/* Horizontal scrolling bracket */}
      <div className="flex gap-8 min-w-max px-4">
        {rounds.map((round, roundIdx) => (
          <div key={roundIdx} className="flex flex-col justify-around gap-4" style={{ minWidth: '200px' }}>
            {/* Round Header */}
            <div className="text-center mb-2 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
              <h3 className="font-fredoka font-bold text-primary text-sm">
                {getRoundName(roundIdx, rounds.length, round.length)}
              </h3>
            </div>

            {/* Matchups */}
            <div className="flex flex-col justify-around gap-8 flex-1">
              {round.map((matchup, matchupIdx) => (
                <div key={matchupIdx} className="relative">
                  <BracketMatchup matchup={matchup} />

                  {/* Connection line to next round */}
                  {roundIdx < rounds.length - 1 && (
                    <svg
                      className="absolute left-full top-1/2 -translate-y-1/2 pointer-events-none"
                      width="32"
                      height="2"
                      style={{ overflow: 'visible' }}
                    >
                      <line
                        x1="0"
                        y1="0"
                        x2="32"
                        y2="0"
                        stroke="#6C63FF"
                        strokeWidth="2"
                        opacity="0.3"
                      />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Champion */}
        {championId && rounds.length > 0 && (
          <div className="flex flex-col justify-center" style={{ minWidth: '150px' }}>
            <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl p-4 text-center">
              <p className="text-xs font-nunito mb-1">🏆 CHAMPION</p>
              <p className="font-fredoka font-bold text-sm">
                {rounds[rounds.length - 1][0]?.winner?.title || 'TBD'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Scroll hint */}
      <div className="text-center mt-4">
        <p className="text-xs text-foreground/40 font-nunito">
          ← Swipe to view full bracket →
        </p>
      </div>
    </div>
  );
}

function BracketMatchup({ matchup }: { matchup: Matchup }) {
  const { movie1, movie2, winner } = matchup;

  return (
    <div className="bg-surface-variant rounded-lg p-2 shadow-sm">
      {/* Movie 1 */}
      <div className={`p-2 rounded mb-1 transition-all ${
        winner?.id === movie1.id
          ? 'bg-primary/20 border border-primary'
          : 'bg-white border border-transparent'
      }`}>
        <div className="flex items-center gap-2">
          {movie1.posterPath && (
            <img
              src={`https://image.tmdb.org/t/p/w92${movie1.posterPath}`}
              alt={movie1.title}
              className="w-8 h-12 rounded object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-nunito font-bold text-xs leading-tight line-clamp-1">
              {movie1.title}
            </p>
            <p className="text-xs text-foreground/60">{movie1.releaseYear}</p>
          </div>
          {winner?.id === movie1.id && (
            <span className="text-primary text-sm">✓</span>
          )}
        </div>
      </div>

      {/* VS divider */}
      <div className="text-center">
        <span className="text-xs font-fredoka text-foreground/30">VS</span>
      </div>

      {/* Movie 2 */}
      <div className={`p-2 rounded mt-1 transition-all ${
        winner?.id === movie2.id
          ? 'bg-primary/20 border border-primary'
          : 'bg-white border border-transparent'
      }`}>
        <div className="flex items-center gap-2">
          {movie2.posterPath && (
            <img
              src={`https://image.tmdb.org/t/p/w92${movie2.posterPath}`}
              alt={movie2.title}
              className="w-8 h-12 rounded object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-nunito font-bold text-xs leading-tight line-clamp-1">
              {movie2.title}
            </p>
            <p className="text-xs text-foreground/60">{movie2.releaseYear}</p>
          </div>
          {winner?.id === movie2.id && (
            <span className="text-primary text-sm">✓</span>
          )}
        </div>
      </div>
    </div>
  );
}

function getRoundName(roundIndex: number, totalRounds: number, matchupsInRound: number): string {
  if (matchupsInRound === 1) return 'FINALS';
  if (matchupsInRound === 2) return 'SEMIFINALS';
  if (matchupsInRound === 4) return 'QUARTERFINALS';
  if (matchupsInRound === 8) return 'ROUND OF 16';
  if (matchupsInRound === 16) return 'ROUND OF 32';
  return `ROUND ${roundIndex + 1}`;
}
