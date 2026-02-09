'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getTopMovies } from '@/lib/tmdb/repository';
import { createVersusMatchups, createMatchups, shuffleArray } from '@/lib/bracket/algorithm';
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

      // Check if this is single actor mode (both actors are the same)
      const isSingleActorMode = lobbyData.actor1_id === lobbyData.actor2_id;

      let matchupsData: Matchup[];

      if (isSingleActorMode && lobbyData.round_matchups) {
        // Single actor knockout: load matchups from database
        const roundMatchups = lobbyData.round_matchups as number[][];
        const allMovies = lobbyData.all_movies as any[];

        // Convert stored matchups to Matchup objects
        matchupsData = roundMatchups.map(([movie1Id, movie2Id]) => {
          const movie1 = allMovies.find(m => m.id === movie1Id);
          const movie2 = allMovies.find(m => m.id === movie2Id);

          return {
            movie1: movie1 ? {
              id: movie1.id,
              title: movie1.title,
              posterPath: movie1.posterPath,
              releaseYear: movie1.releaseYear,
              voteAverage: 0,
              voteCount: 0,
              popularity: 0,
              overview: '',
              releaseDate: '',
              backdropPath: null,
              character: undefined,
            } : null,
            movie2: movie2 ? {
              id: movie2.id,
              title: movie2.title,
              posterPath: movie2.posterPath,
              releaseYear: movie2.releaseYear,
              voteAverage: 0,
              voteCount: 0,
              popularity: 0,
              overview: '',
              releaseDate: '',
              backdropPath: null,
              character: undefined,
            } : null,
            winner: null,
          };
        }).filter(m => m.movie1 && m.movie2) as Matchup[];

        console.log('Loaded', matchupsData.length, 'matchups for Round', lobbyData.current_round);
      } else if (!isSingleActorMode) {
        // Versus mode: fetch both actors' movies and create versus matchups
        const [movies1, movies2] = await Promise.all([
          getTopMovies(lobbyData.actor1_id, lobbyData.movie_count),
          getTopMovies(lobbyData.actor2_id, lobbyData.movie_count),
        ]);

        // Use lobby ID as seed to ensure all players see the same matchups
        matchupsData = createVersusMatchups(movies1, movies2, lobbyData.id);
      } else {
        // Fallback: no matchups yet
        matchupsData = [];
      }

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
    if (!lobby) return;

    const channel = supabase
      .channel(`game-${code}-votes`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
          filter: `lobby_id=eq.${lobby.id}`,
        },
        (payload) => {
          const newVote = payload.new as Vote;
          console.log('New vote received:', newVote);

          // Use state callback to get current lobby value
          setLobby(currentLobby => {
            if (currentLobby && newVote.matchup_index === currentLobby.current_matchup - 1) {
              console.log('Vote is for current matchup, adding to votes');
              setVotes(prev => {
                // Avoid duplicates
                if (prev.some(v => v.id === newVote.id)) return prev;
                console.log('Adding vote, new count:', prev.length + 1);
                return [...prev, newVote];
              });
              if (newVote.participant_id === participantId) {
                setHasVoted(true);
              }
            } else {
              console.log('Vote is for different matchup, ignoring');
            }
            return currentLobby;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToLobbyUpdates = () => {
    if (!lobby) return;

    const channel = supabase
      .channel(`game-${code}-lobby`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lobbies',
          filter: `id=eq.${lobby.id}`,
        },
        async (payload) => {
          const updatedLobby = payload.new as Lobby;
          console.log('Lobby updated:', updatedLobby);

          // Check if game completed
          if (!updatedLobby.is_active) {
            router.push(`/multiplayer/results/${code}`);
            return;
          }

          // Check if matchup or round advanced
          const matchupChanged = updatedLobby.current_matchup !== lobby?.current_matchup;
          const roundChanged = updatedLobby.current_round !== lobby?.current_round;

          if (matchupChanged || roundChanged) {
            console.log('Matchup/Round changed - reloading game data');

            if (roundChanged) {
              console.log('Round advanced from', lobby?.current_round, 'to', updatedLobby.current_round);
              // Reload entire game (new round means new matchups)
              await loadGameData();
            } else {
              console.log('Matchup advanced from', lobby?.current_matchup, 'to', updatedLobby.current_matchup);
              setLobby(updatedLobby);
              setVotes([]);
              setHasVoted(false);

              // Reload votes for the new matchup
              const { data: newVotes } = await supabase
                .from('votes')
                .select('*')
                .eq('lobby_id', updatedLobby.id)
                .eq('matchup_index', updatedLobby.current_matchup - 1);

              if (newVotes) {
                console.log('Loaded', newVotes.length, 'votes for new matchup');
                setVotes(newVotes);
                const userVoted = newVotes.some(v => v.participant_id === participantId);
                setHasVoted(userVoted);
              }
            }
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
        // Handle duplicate vote gracefully
        if (response.status === 400 && data.error === 'Already voted for this matchup') {
          console.log('Already voted, ignoring duplicate vote attempt');
          setHasVoted(true);
          return;
        }
        throw new Error(data.error || 'Failed to vote');
      }

      // Server-side vote route handles all game logic:
      // - Advances to next matchup
      // - Creates new rounds when round completes
      // - Sets is_active: false and champion_movie_id when tournament completes
      // Client just subscribes to lobby updates and reacts accordingly
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

  // Determine if this is single actor knockout mode
  const isSingleActorMode = lobby.actor1_id === lobby.actor2_id;

  // Calculate the matchup index
  // For single actor knockout: use round_start_matchup to get position within current round
  // For versus mode: use current_matchup directly (1-indexed)
  let matchupIndexInRound: number;
  if (isSingleActorMode) {
    matchupIndexInRound = lobby.current_matchup - (lobby.round_start_matchup || 1);
  } else {
    matchupIndexInRound = lobby.current_matchup - 1;
  }

  const currentMatchup = matchups[matchupIndexInRound];

  if (!currentMatchup) {
    console.error('No matchup found at index', matchupIndexInRound, 'in round', lobby.current_round);
    console.error('current_matchup:', lobby.current_matchup, 'round_start_matchup:', lobby.round_start_matchup);
    console.error('matchups array length:', matchups.length);
    console.error('isSingleActorMode:', isSingleActorMode);
    return <LoadingSpinner />;
  }
  const voteProgress = votes.length;
  const totalPlayers = participants.length;
  const progressPercent = (voteProgress / totalPlayers) * 100;

  // Calculate round info for bracket-style display
  let roundName = '';
  let roundProgress = 0;
  let matchupInRound = 0;
  let totalInRound = 0;

  if (isSingleActorMode) {
    // Use actual round number from database
    const currentRound = lobby.current_round || 1;
    totalInRound = matchups.length;
    // Calculate position within round (1-indexed for display)
    matchupInRound = matchupIndexInRound + 1;

    // Determine round name based on number of matchups
    switch (totalInRound) {
      case 16:
        roundName = 'Round of 32';
        break;
      case 8:
        roundName = 'Round of 16';
        break;
      case 4:
        roundName = 'Quarterfinals';
        break;
      case 2:
        roundName = 'Semifinals';
        break;
      case 1:
        roundName = 'Finals';
        break;
      default:
        roundName = `Round ${currentRound}`;
    }

    roundProgress = (matchupInRound / totalInRound) * 100;
  }

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
          {isSingleActorMode ? `${lobby.actor1_name} Tournament` : `${lobby.actor1_name} VS ${lobby.actor2_name}`}
        </motion.h1>

        <div className="h-1" />

        {isSingleActorMode ? (
          <>
            <p className="text-sm text-foreground/60 font-nunito">
              Match {matchupInRound} of {totalInRound}
            </p>
            {/* Round Progress Bar */}
            <div className="mt-2 h-1 bg-surface-variant rounded-full overflow-hidden max-w-xs mx-auto">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${roundProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-foreground/60 font-nunito">
            Match {lobby.current_matchup} of {matchups.length}
          </p>
        )}

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
