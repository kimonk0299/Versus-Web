'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';
import type { Lobby, Vote } from '@/lib/supabase/types';
import html2canvas from 'html2canvas';

export default function BracketViewPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const bracketRef = useRef<HTMLDivElement>(null);

  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    loadBracketData();
  }, [code]);

  const loadBracketData = async () => {
    try {
      // Get lobby
      const { data: lobbyData, error: lobbyError } = await supabase
        .from('lobbies')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (lobbyError) throw lobbyError;
      setLobby(lobbyData);

      // Get all votes for this lobby
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .eq('lobby_id', lobbyData.id)
        .order('matchup_index', { ascending: true });

      if (votesError) throw votesError;
      setVotes(votesData);

      setIsLoading(false);
    } catch (err: any) {
      console.error('Load bracket error:', err);
      setIsLoading(false);
    }
  };

  const shareAsImage = async () => {
    if (!bracketRef.current) return;

    setIsSharing(true);
    try {
      // Convert the bracket view to canvas
      const canvas = await html2canvas(bracketRef.current, {
        backgroundColor: '#FFF8F0',
        scale: 2, // Higher quality
      });

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], 'versus-bracket.png', { type: 'image/png' });

        // Try native share API
        if (navigator.share && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Versus Tournament Bracket',
              text: `Check out this tournament bracket! Lobby: ${lobby?.code}`,
            });
          } catch (err) {
            console.log('Share cancelled or failed:', err);
          }
        } else {
          // Fallback: download the image
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

  if (isLoading) return <LoadingSpinner />;

  if (!lobby) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl text-center">
          <h2 className="text-2xl font-fredoka font-bold text-secondary mb-4">
            Error
          </h2>
          <p className="text-foreground/70 mb-6">Bracket not found</p>
          <button
            onClick={() => router.push('/')}
            className="bg-primary text-white rounded-xl font-nunito font-bold px-8 py-4 hover:shadow-lg transition-all"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const isSingleActorMode = lobby.actor1_id === lobby.actor2_id;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2"
          >
            <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-fredoka font-bold text-primary">
            {isSingleActorMode ? 'Tournament Bracket' : 'Match Results'}
          </h1>
          <button
            onClick={shareAsImage}
            disabled={isSharing}
            className="p-2 bg-primary text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            aria-label="Share as image"
          >
            {isSharing ? '...' : '📤'}
          </button>
        </div>

        {/* Bracket Content */}
        <div ref={bracketRef} className="bg-white rounded-2xl p-6 shadow-xl">
          {isSingleActorMode ? (
            <SingleActorBracket lobby={lobby} votes={votes} />
          ) : (
            <VersusMatchups lobby={lobby} votes={votes} />
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-fredoka font-bold text-lg px-12 py-4 hover:shadow-2xl hover:scale-105 transition-all"
          >
            PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
}

// Single Actor Tournament Bracket Component
function SingleActorBracket({ lobby, votes }: { lobby: Lobby; votes: Vote[] }) {
  const allMovies = (lobby.all_movies as any[]) || [];

  // Group votes by matchup and determine winners
  const matchupResults: Record<number, { movie1Id: number; movie2Id: number; winnerId: number; voteCount: Record<number, number> }> = {};

  votes.forEach(vote => {
    if (!matchupResults[vote.matchup_index]) {
      matchupResults[vote.matchup_index] = {
        movie1Id: 0,
        movie2Id: 0,
        winnerId: 0,
        voteCount: {},
      };
    }

    matchupResults[vote.matchup_index].voteCount[vote.movie_id] =
      (matchupResults[vote.matchup_index].voteCount[vote.movie_id] || 0) + 1;
  });

  // Determine winner for each matchup
  Object.keys(matchupResults).forEach(matchupIndex => {
    const result = matchupResults[Number(matchupIndex)];
    const voteCounts = result.voteCount;
    const sortedMovies = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
    if (sortedMovies.length > 0) {
      result.winnerId = parseInt(sortedMovies[0][0]);
    }
  });

  // Build rounds from round_matchups history
  // For now, show all matchups in order
  const roundMatchups = (lobby.round_matchups as number[][]) || [];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-fredoka font-bold text-primary mb-2">
          {lobby.actor1_name}
        </h2>
        <p className="text-foreground/60 font-nunito">Tournament Champion 🏆</p>
      </div>

      {/* Current Round Matchups */}
      <div className="space-y-4">
        {roundMatchups.map((matchup, idx) => {
          const movie1 = allMovies.find(m => m.id === matchup[0]);
          const movie2 = allMovies.find(m => m.id === matchup[1]);

          if (!movie1 || !movie2) return null;

          // Find votes for this matchup (need to calculate matchup index)
          // This is simplified - in reality we'd need to track which round this is from
          const matchupVotes = votes.filter(v =>
            (v.movie_id === movie1.id || v.movie_id === movie2.id)
          );

          const movie1Votes = matchupVotes.filter(v => v.movie_id === movie1.id).length;
          const movie2Votes = matchupVotes.filter(v => v.movie_id === movie2.id).length;
          const winner = movie1Votes > movie2Votes ? movie1.id :
                        movie2Votes > movie1Votes ? movie2.id : null;

          return (
            <motion.div
              key={idx}
              className="bg-surface-variant rounded-xl p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="flex items-center gap-3">
                {/* Movie 1 */}
                <div className={`flex-1 p-3 rounded-lg ${winner === movie1.id ? 'bg-primary/20 border-2 border-primary' : 'bg-white'}`}>
                  <p className="font-nunito font-bold text-sm">{movie1.title}</p>
                  <p className="text-xs text-foreground/60">{movie1.releaseYear}</p>
                  {movie1Votes > 0 && (
                    <p className="text-xs font-bold text-primary mt-1">{movie1Votes} votes</p>
                  )}
                </div>

                {/* VS */}
                <span className="text-sm font-fredoka font-bold text-foreground/40">VS</span>

                {/* Movie 2 */}
                <div className={`flex-1 p-3 rounded-lg ${winner === movie2.id ? 'bg-primary/20 border-2 border-primary' : 'bg-white'}`}>
                  <p className="font-nunito font-bold text-sm">{movie2.title}</p>
                  <p className="text-xs text-foreground/60">{movie2.releaseYear}</p>
                  {movie2Votes > 0 && (
                    <p className="text-xs font-bold text-primary mt-1">{movie2Votes} votes</p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Champion */}
      {lobby.champion_movie_id && (
        <div className="mt-8 text-center">
          <div className="inline-block bg-gradient-to-r from-primary to-secondary text-white rounded-2xl p-6">
            <p className="text-sm font-nunito mb-2">🏆 CHAMPION 🏆</p>
            <p className="text-2xl font-fredoka font-bold">
              {allMovies.find(m => m.id === lobby.champion_movie_id)?.title || 'Unknown'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Versus Mode Matchups Component
function VersusMatchups({ lobby, votes }: { lobby: Lobby; votes: Vote[] }) {
  // Group votes by matchup
  const matchupVotes: Record<number, Vote[]> = {};
  votes.forEach(vote => {
    if (!matchupVotes[vote.matchup_index]) {
      matchupVotes[vote.matchup_index] = [];
    }
    matchupVotes[vote.matchup_index].push(vote);
  });

  // Determine winners and count actor wins
  let actor1Wins = 0;
  let actor2Wins = 0;

  const matchupResults = Object.keys(matchupVotes).map(matchupIndex => {
    const votes = matchupVotes[Number(matchupIndex)];
    const voteCounts: Record<number, number> = {};

    votes.forEach(v => {
      voteCounts[v.movie_id] = (voteCounts[v.movie_id] || 0) + 1;
    });

    const sortedMovies = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
    const winnerId = sortedMovies.length > 0 ? parseInt(sortedMovies[0][0]) : null;

    return {
      matchupIndex: Number(matchupIndex),
      voteCounts,
      winnerId,
    };
  });

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-fredoka font-bold mb-2">
          {lobby.actor1_name} <span className="text-primary">VS</span> {lobby.actor2_name}
        </h2>
        <p className="text-foreground/60 font-nunito">Head-to-Head Results</p>
      </div>

      {/* Matchup History */}
      <div className="space-y-3">
        {matchupResults.map((result, idx) => (
          <motion.div
            key={result.matchupIndex}
            className="bg-surface-variant rounded-xl p-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <p className="text-xs font-nunito text-foreground/60 mb-2">Match {result.matchupIndex + 1}</p>
            <div className="space-y-2">
              {Object.entries(result.voteCounts).map(([movieId, count]) => (
                <div
                  key={movieId}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    result.winnerId === parseInt(movieId) ? 'bg-primary/20 border-2 border-primary' : 'bg-white'
                  }`}
                >
                  <span className="font-nunito text-sm">Movie {movieId}</span>
                  <span className="font-nunito font-bold text-primary">{count} votes</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Final Score */}
      <div className="mt-8 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl p-6">
        <p className="text-sm font-nunito text-center mb-4">FINAL SCORE</p>
        <div className="flex items-center justify-around">
          <div className="text-center">
            <p className="text-3xl font-fredoka font-bold">{actor1Wins}</p>
            <p className="text-sm font-nunito">{lobby.actor1_name}</p>
          </div>
          <div className="text-2xl font-fredoka">-</div>
          <div className="text-center">
            <p className="text-3xl font-fredoka font-bold">{actor2Wins}</p>
            <p className="text-sm font-nunito">{lobby.actor2_name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
