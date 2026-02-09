'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import ConfettiAnimation from '@/components/ConfettiAnimation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';
import type { Lobby, Vote } from '@/lib/supabase/types';

export default function MultiplayerResultsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();

  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [actor1Wins, setActor1Wins] = useState(0);
  const [actor2Wins, setActor2Wins] = useState(0);
  const [championMovie, setChampionMovie] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [code]);

  const loadResults = async () => {
    try {
      // Get lobby
      const { data: lobbyData, error: lobbyError } = await supabase
        .from('lobbies')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (lobbyError) throw lobbyError;
      setLobby(lobbyData);

      // Check if single actor knockout with champion
      const isSingleActorMode = lobbyData.actor1_id === lobbyData.actor2_id;
      if (isSingleActorMode && lobbyData.champion_movie_id) {
        // Load champion movie from all_movies
        const allMovies = lobbyData.all_movies as any[];
        const champion = allMovies?.find(m => m.id === lobbyData.champion_movie_id);
        if (champion) {
          setChampionMovie(champion);
          setIsLoading(false);
          return;
        }
      }

      // Get all votes grouped by matchup
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select('matchup_index, movie_id, participant_id')
        .eq('lobby_id', lobbyData.id)
        .order('matchup_index', { ascending: true });

      if (votesError) throw votesError;

      // Get host for tiebreaker
      const { data: host } = await supabase
        .from('participants')
        .select('id')
        .eq('lobby_id', lobbyData.id)
        .eq('is_host', true)
        .single();

      // Determine winner for each matchup
      const matchupWinners: Record<number, number> = {};
      const matchupsVotes: Record<number, typeof votesData> = {};

      // Group votes by matchup
      votesData.forEach(vote => {
        if (!matchupsVotes[vote.matchup_index]) {
          matchupsVotes[vote.matchup_index] = [];
        }
        matchupsVotes[vote.matchup_index].push(vote);
      });

      // Determine winner for each matchup
      Object.entries(matchupsVotes).forEach(([matchupIndex, votes]) => {
        const voteCounts: Record<number, number> = {};
        votes.forEach(v => {
          voteCounts[v.movie_id] = (voteCounts[v.movie_id] || 0) + 1;
        });

        const sortedMovies = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
        let winnerMovieId = parseInt(sortedMovies[0][0]);

        // Check for tie
        if (sortedMovies.length >= 2 && sortedMovies[0][1] === sortedMovies[1][1]) {
          // Use host's vote as tiebreaker
          if (host) {
            const hostVote = votes.find(v => v.participant_id === host.id);
            if (hostVote) {
              winnerMovieId = hostVote.movie_id;
            }
          }
        }

        matchupWinners[parseInt(matchupIndex)] = winnerMovieId;
      });

      // Now we need to determine which actor each winning movie belongs to
      // Fetch movies for both actors
      const { getTopMovies } = await import('@/lib/tmdb/repository');
      const [movies1, movies2] = await Promise.all([
        getTopMovies(lobbyData.actor1_id, lobbyData.movie_count),
        getTopMovies(lobbyData.actor2_id, lobbyData.movie_count),
      ]);

      const actor1MovieIds = new Set(movies1.map(m => m.id));
      const actor2MovieIds = new Set(movies2.map(m => m.id));

      // Count wins for each actor
      let actor1Wins = 0;
      let actor2Wins = 0;

      Object.values(matchupWinners).forEach(winnerMovieId => {
        if (actor1MovieIds.has(winnerMovieId)) {
          actor1Wins++;
        } else if (actor2MovieIds.has(winnerMovieId)) {
          actor2Wins++;
        }
      });

      console.log('Actor 1 wins:', actor1Wins);
      console.log('Actor 2 wins:', actor2Wins);

      setActor1Wins(actor1Wins);
      setActor2Wins(actor2Wins);

      setIsLoading(false);
    } catch (err: any) {
      console.error('Load results error:', err);
      setIsLoading(false);
    }
  };

  const handlePlayAgain = () => {
    router.push('/');
  };

  if (isLoading) return <LoadingSpinner />;

  if (!lobby) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl text-center">
          <h2 className="text-2xl font-fredoka font-bold text-secondary mb-4">
            Error
          </h2>
          <p className="text-foreground/70 mb-6">Results not found</p>
          <button
            onClick={() => router.push('/')}
            style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '1rem', paddingBottom: '1rem' }}
            className="bg-primary text-white rounded-xl font-nunito font-bold hover:shadow-lg transition-all"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const isSingleActorMode = lobby.actor1_id === lobby.actor2_id;
  const winner = actor1Wins > actor2Wins ? lobby.actor1_name : lobby.actor2_name;
  const winnerWins = Math.max(actor1Wins, actor2Wins);
  const loserWins = Math.min(actor1Wins, actor2Wins);
  const totalMatches = actor1Wins + actor2Wins;

  return (
    <div className="min-h-screen flex flex-col justify-center p-4 bg-gradient-to-br from-primary/20 via-background to-secondary/20 relative overflow-hidden">
      <ConfettiAnimation />

      <div className="w-full relative z-10 max-w-md mx-auto">
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
              {isSingleActorMode && championMovie ? championMovie.title : !isSingleActorMode ? `${winner} WINS!` : 'CHAMPION!'}
            </span>
          </h1>
          <p className="text-2xl text-foreground/70 font-nunito">
            {isSingleActorMode && championMovie
              ? `${lobby.actor1_name}'s Ultimate Champion!`
              : !isSingleActorMode
              ? `${winner} dominated the battle!`
              : `${lobby.actor1_name}'s movies battled it out!`
            }
          </p>
          {isSingleActorMode && championMovie && championMovie.releaseYear && (
            <p className="text-xl text-foreground/50 font-nunito mt-2">
              {championMovie.releaseYear}
            </p>
          )}
        </motion.div>

        {/* Champion Movie Poster (single actor mode) */}
        {isSingleActorMode && championMovie && championMovie.posterPath && (
          <motion.div
            className="mb-8 flex justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring' }}
          >
            <img
              src={`https://image.tmdb.org/t/p/w500${championMovie.posterPath}`}
              alt={championMovie.title}
              className="rounded-2xl shadow-2xl max-w-xs w-full"
            />
          </motion.div>
        )}

        {/* Score Breakdown (only for versus mode) */}
        {!isSingleActorMode && (
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
            <div className="flex items-center justify-between p-4 rounded-xl bg-primary/10">
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
                {winner === lobby.actor1_name ? lobby.actor2_name : lobby.actor1_name}
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
        )}

        {/* Play Again Button */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <button
            onClick={handlePlayAgain}
            style={{ paddingLeft: '3rem', paddingRight: '3rem', paddingTop: '2rem', paddingBottom: '2rem' }}
            className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-fredoka font-bold text-xl hover:shadow-2xl hover:scale-105 transition-all"
          >
            PLAY AGAIN
          </button>
        </motion.div>
      </div>
    </div>
  );
}
