'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getTopMovies } from '@/lib/tmdb/repository';
import { createVersusMatchups } from '@/lib/bracket/algorithm';
import MovieCard from '@/components/MovieCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';
import type { Lobby, Participant, Vote } from '@/lib/supabase/types';
import type { Movie, Matchup } from '@/lib/bracket/types';

export default function MultiplayerGamePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const participantId = searchParams.get('participant');

  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadGameData();
  }, [code]);

  useEffect(() => {
    if (lobby) {
      subscribeToVotes();
      subscribeToLobbyUpdates();
    }
  }, [lobby]);

  const loadGameData = async () => {
    try {
      // Get lobby
      const { data: lobbyData, error: lobbyError } = await supabase
        .from('lobbies')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (lobbyError) throw lobbyError;
      setLobby(lobbyData);

      // Get participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*')
        .eq('lobby_id', lobbyData.id);

      if (participantsError) throw participantsError;
      setParticipants(participantsData);

      // Fetch movies and create matchups
      const [movies1, movies2] = await Promise.all([
        getTopMovies(lobbyData.actor1_id, lobbyData.movie_count),
        getTopMovies(lobbyData.actor2_id, lobbyData.movie_count),
      ]);

      const matchupsData = createVersusMatchups(movies1, movies2);
      setMatchups(matchupsData);

      // Load votes for current matchup
      await loadCurrentVotes(lobbyData);

      setIsLoading(false);
    } catch (err: any) {
      console.error('Load game error:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const loadCurrentVotes = async (currentLobby: Lobby) => {
    const { data: votesData, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .eq('lobby_id', currentLobby.id)
      .eq('matchup_index', currentLobby.current_matchup - 1);

    if (!votesError && votesData) {
      setVotes(votesData);
      const userVoted = votesData.some(v => v.participant_id === participantId);
      setHasVoted(userVoted);
    }
  };

  const subscribeToVotes = () => {
    const channel = supabase
      .channel(`game-${code}-votes`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
        },
        (payload) => {
          const newVote = payload.new as Vote;
          if (lobby && newVote.matchup_index === lobby.current_matchup - 1) {
            setVotes(prev => [...prev, newVote]);
            if (newVote.participant_id === participantId) {
              setHasVoted(true);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToLobbyUpdates = () => {
    const channel = supabase
      .channel(`game-${code}-lobby`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lobbies',
        },
        async (payload) => {
          const updatedLobby = payload.new as Lobby;

          // Check if game completed
          if (!updatedLobby.is_active) {
            router.push(`/multiplayer/results/${code}`);
            return;
          }

          // Check if matchup advanced
          if (updatedLobby.current_matchup !== lobby?.current_matchup) {
            setLobby(updatedLobby);
            setVotes([]);
            setHasVoted(false);
            await loadCurrentVotes(updatedLobby);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleVote = async (movie: Movie) => {
    if (hasVoted || !lobby) return;

    try {
      const response = await fetch(`/api/lobbies/${code}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          matchup_index: lobby.current_matchup - 1,
          movie_id: movie.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to vote');
      }

      // If all voted, check if we need to end game or just advance
      if (data.allVoted) {
        const isLastMatchup = lobby.current_matchup >= matchups.length;

        if (isLastMatchup) {
          // End the game
          await supabase
            .from('lobbies')
            .update({ is_active: false })
            .eq('id', lobby.id);
        }
        // Otherwise the vote route already advanced the matchup
      }
    } catch (err: any) {
      console.error('Vote error:', err);
      setError(err.message);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (error || !lobby || matchups.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl text-center">
          <h2 className="text-2xl font-fredoka font-bold text-secondary mb-4">
            Error
          </h2>
          <p className="text-foreground/70 mb-6">{error || 'Game not found'}</p>
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

  const currentMatchup = matchups[lobby.current_matchup - 1];
  if (!currentMatchup) {
    return <LoadingSpinner />;
  }

  const voteProgress = votes.length;
  const totalPlayers = participants.length;
  const progressPercent = (voteProgress / totalPlayers) * 100;

  return (
    <div className="h-screen flex flex-col bg-background p-4">
      {/* Top Bar */}
      <div className="flex items-center mb-2 flex-shrink-0">
        <button
          onClick={() => router.push('/')}
          className="p-2 -ml-2"
        >
          <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="ml-2 text-xl font-nunito font-medium text-foreground">
          Lobby {lobby.code}
        </span>
      </div>

      {/* 8dp spacing */}
      <div className="h-2 flex-shrink-0" />

      {/* Matchup Info */}
      <div className="text-center flex-shrink-0">
        <motion.h1
          className="text-3xl font-fredoka font-bold text-primary"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {lobby.actor1_name} VS {lobby.actor2_name}
        </motion.h1>

        <div className="h-1" />

        <p className="text-sm text-foreground/60 font-nunito">
          Match {lobby.current_matchup} of {matchups.length}
        </p>

        {/* 8dp spacing */}
        <div className="h-2" />

        {/* Vote Progress */}
        <div className="bg-white rounded-xl p-3 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-nunito text-foreground/60">
              {hasVoted ? '✓ You voted!' : 'Waiting for your vote...'}
            </span>
            <span className="text-xs font-nunito font-bold text-primary">
              {voteProgress}/{totalPlayers} voted
            </span>
          </div>
          <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* 16dp spacing */}
      <div className="h-4 flex-shrink-0" />

      {/* Tap your pick */}
      <p className="text-center text-base font-nunito font-medium text-foreground/70 flex-shrink-0">
        {hasVoted ? 'Waiting for others...' : 'Tap your pick!'}
      </p>

      {/* 16dp spacing */}
      <div className="h-4 flex-shrink-0" />

      {/* Matchup - fills remaining space */}
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        {/* Movie 1 */}
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <motion.div
            className="h-full"
            style={{ aspectRatio: '2/3', opacity: hasVoted ? 0.5 : 1 }}
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: hasVoted ? 0.5 : 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <MovieCard
              movie={currentMatchup.movie1}
              onClick={() => handleVote(currentMatchup.movie1)}
            />
          </motion.div>
        </div>

        {/* VS text */}
        <div className="text-center flex-shrink-0">
          <span className="text-3xl font-fredoka font-black text-primary">VS</span>
        </div>

        {/* Movie 2 */}
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <motion.div
            className="h-full"
            style={{ aspectRatio: '2/3', opacity: hasVoted ? 0.5 : 1 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: hasVoted ? 0.5 : 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <MovieCard
              movie={currentMatchup.movie2}
              onClick={() => handleVote(currentMatchup.movie2)}
            />
          </motion.div>
        </div>
      </div>

      {/* 16dp bottom spacing */}
      <div className="h-4 flex-shrink-0" />
    </div>
  );
}
