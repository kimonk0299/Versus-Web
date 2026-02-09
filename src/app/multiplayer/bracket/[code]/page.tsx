'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';
import type { Lobby, Vote, Participant } from '@/lib/supabase/types';
import html2canvas from 'html2canvas';

interface MovieData {
  id: number;
  title: string;
  posterPath: string | null;
  releaseYear: number;
}

interface MatchupResult {
  movie1: MovieData;
  movie2: MovieData;
  winner: MovieData | null;
  movie1Votes: number;
  movie2Votes: number;
  matchupIndex: number;
}

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
  const [host, setHost] = useState<Participant | null>(null);
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

      // Get host for tiebreaker
      const { data: hostData } = await supabase
        .from('participants')
        .select('*')
        .eq('lobby_id', lobbyData.id)
        .eq('is_host', true)
        .single();

      if (hostData) setHost(hostData);

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
              title: 'Versus Tournament Bracket',
              text: `Check out this tournament! Lobby: ${lobby?.code}`,
            });
          } catch (err) {
            console.log('Share cancelled');
          }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `versus-bracket-${code}.png`;
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
          <h2 className="text-2xl font-fredoka font-bold text-secondary mb-4">Error</h2>
          <p className="text-foreground/70 mb-6">Bracket not found</p>
          <button
            onClick={() => router.push('/')}
            className="bg-primary text-white rounded-xl font-nunito font-bold px-8 py-4"
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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-fredoka font-bold text-primary">
            {isSingleActorMode ? 'Tournament Bracket' : 'Match History'}
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
          {isSingleActorMode ? (
            <SingleActorBracket lobby={lobby} votes={votes} host={host} />
          ) : (
            <VersusMatchups lobby={lobby} votes={votes} host={host} />
          )}
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

function SingleActorBracket({ lobby, votes, host }: { lobby: Lobby; votes: Vote[]; host: Participant | null }) {
  const allMovies = (lobby.all_movies as MovieData[]) || [];

  // Build rounds from matchup history
  const rounds: MatchupResult[][] = [];
  let currentRoundMatchups: MatchupResult[] = [];
  let expectedMatchupsInRound = Math.floor(allMovies.length / 2);

  // Group votes by matchup and determine winners
  const matchupVotes: Record<number, Vote[]> = {};
  votes.forEach(vote => {
    if (!matchupVotes[vote.matchup_index]) {
      matchupVotes[vote.matchup_index] = [];
    }
    matchupVotes[vote.matchup_index].push(vote);
  });

  // Process each matchup
  Object.keys(matchupVotes).sort((a, b) => Number(a) - Number(b)).forEach(matchupIndexStr => {
    const matchupIndex = Number(matchupIndexStr);
    const matchupVotesList = matchupVotes[matchupIndex];

    // Count votes per movie
    const voteCounts: Record<number, number> = {};
    matchupVotesList.forEach(v => {
      voteCounts[v.movie_id] = (voteCounts[v.movie_id] || 0) + 1;
    });

    // Get the two movies in this matchup
    const movieIds = Object.keys(voteCounts).map(Number);
    if (movieIds.length < 2) return;

    const movie1 = allMovies.find(m => m.id === movieIds[0]);
    const movie2 = allMovies.find(m => m.id === movieIds[1]);
    if (!movie1 || !movie2) return;

    const movie1Votes = voteCounts[movie1.id] || 0;
    const movie2Votes = voteCounts[movie2.id] || 0;

    let winnerId = movie1Votes > movie2Votes ? movie1.id :
                   movie2Votes > movie1Votes ? movie2.id : null;

    // Tie-breaker
    if (winnerId === null && host) {
      const hostVote = matchupVotesList.find(v => v.participant_id === host.id);
      if (hostVote) winnerId = hostVote.movie_id;
    }

    const winner = winnerId ? allMovies.find(m => m.id === winnerId) : null;

    currentRoundMatchups.push({
      movie1,
      movie2,
      winner: winner || null,
      movie1Votes,
      movie2Votes,
      matchupIndex,
    });

    // Check if round is complete
    if (currentRoundMatchups.length === expectedMatchupsInRound) {
      rounds.push([...currentRoundMatchups]);
      currentRoundMatchups = [];
      expectedMatchupsInRound = Math.floor(expectedMatchupsInRound / 2);
    }
  });

  // Add any remaining matchups as final round
  if (currentRoundMatchups.length > 0) {
    rounds.push(currentRoundMatchups);
  }

  const getRoundName = (roundIndex: number, totalRounds: number) => {
    const matchupsInRound = rounds[roundIndex].length;
    if (matchupsInRound === 1) return 'Finals';
    if (matchupsInRound === 2) return 'Semifinals';
    if (matchupsInRound === 4) return 'Quarterfinals';
    if (matchupsInRound === 8) return 'Round of 16';
    return `Round ${roundIndex + 1}`;
  };

  const championMovie = lobby.champion_movie_id
    ? allMovies.find(m => m.id === lobby.champion_movie_id)
    : null;

  return (
    <div className="space-y-8">
      {/* Actor Name */}
      <div className="text-center">
        <h2 className="text-2xl font-fredoka font-bold text-primary">{lobby.actor1_name}</h2>
        <p className="text-sm text-foreground/60 font-nunito mt-1">Tournament Bracket</p>
      </div>

      {/* Rounds */}
      {rounds.map((round, roundIdx) => (
        <div key={roundIdx} className="space-y-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent flex-1"></div>
            <h3 className="font-fredoka font-bold text-primary text-sm">
              {getRoundName(roundIdx, rounds.length)}
            </h3>
            <div className="h-px bg-gradient-to-r from-primary via-transparent to-transparent flex-1"></div>
          </div>

          {round.map((matchup, matchupIdx) => (
            <MatchupCard key={matchupIdx} matchup={matchup} />
          ))}
        </div>
      ))}

      {/* Champion */}
      {championMovie && (
        <div className="mt-8 text-center">
          <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-2xl p-6">
            <p className="text-sm font-nunito mb-2">🏆 CHAMPION 🏆</p>
            <p className="text-2xl font-fredoka font-bold">{championMovie.title}</p>
            {championMovie.releaseYear && (
              <p className="text-sm font-nunito mt-1 opacity-90">{championMovie.releaseYear}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function VersusMatchups({ lobby, votes, host }: { lobby: Lobby; votes: Vote[]; host: Participant | null }) {
  const allMovies = (lobby.all_movies as MovieData[]) || [];

  // Group votes by matchup
  const matchupVotes: Record<number, Vote[]> = {};
  votes.forEach(vote => {
    if (!matchupVotes[vote.matchup_index]) {
      matchupVotes[vote.matchup_index] = [];
    }
    matchupVotes[vote.matchup_index].push(vote);
  });

  // Build matchup results
  const matchups: MatchupResult[] = [];
  let actor1Wins = 0;
  let actor2Wins = 0;

  // Get actor movie sets
  const actor1MovieIds = new Set(
    allMovies.filter((_, idx) => idx < lobby.movie_count).map(m => m.id)
  );

  Object.keys(matchupVotes).sort((a, b) => Number(a) - Number(b)).forEach(matchupIndexStr => {
    const matchupIndex = Number(matchupIndexStr);
    const matchupVotesList = matchupVotes[matchupIndex];

    const voteCounts: Record<number, number> = {};
    matchupVotesList.forEach(v => {
      voteCounts[v.movie_id] = (voteCounts[v.movie_id] || 0) + 1;
    });

    const movieIds = Object.keys(voteCounts).map(Number);
    if (movieIds.length < 2) return;

    const movie1 = allMovies.find(m => m.id === movieIds[0]);
    const movie2 = allMovies.find(m => m.id === movieIds[1]);
    if (!movie1 || !movie2) return;

    const movie1Votes = voteCounts[movie1.id] || 0;
    const movie2Votes = voteCounts[movie2.id] || 0;

    let winnerId = movie1Votes > movie2Votes ? movie1.id :
                   movie2Votes > movie1Votes ? movie2.id : null;

    // Tie-breaker
    if (winnerId === null && host) {
      const hostVote = matchupVotesList.find(v => v.participant_id === host.id);
      if (hostVote) winnerId = hostVote.movie_id;
    }

    const winner = winnerId ? allMovies.find(m => m.id === winnerId) : null;

    // Count actor wins
    if (winner) {
      if (actor1MovieIds.has(winner.id)) {
        actor1Wins++;
      } else {
        actor2Wins++;
      }
    }

    matchups.push({
      movie1,
      movie2,
      winner: winner || null,
      movie1Votes,
      movie2Votes,
      matchupIndex,
    });
  });

  const finalWinner = actor1Wins > actor2Wins ? lobby.actor1_name : lobby.actor2_name;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-fredoka font-bold">
          {lobby.actor1_name} <span className="text-primary">VS</span> {lobby.actor2_name}
        </h2>
        <p className="text-sm text-foreground/60 font-nunito mt-1">Head-to-Head Results</p>
      </div>

      {/* Matchups */}
      <div className="space-y-3">
        {matchups.map((matchup, idx) => (
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
            <p className="text-sm font-nunito mt-1">{lobby.actor1_name}</p>
          </div>
          <div className="text-2xl font-fredoka">-</div>
          <div className="text-center">
            <p className="text-4xl font-fredoka font-bold">{actor2Wins}</p>
            <p className="text-sm font-nunito mt-1">{lobby.actor2_name}</p>
          </div>
        </div>
        <p className="text-center text-sm font-nunito mt-4 opacity-90">
          🏆 {finalWinner} Wins!
        </p>
      </div>
    </div>
  );
}

function MatchupCard({ matchup }: { matchup: MatchupResult }) {
  const { movie1, movie2, winner, movie1Votes, movie2Votes } = matchup;

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
              <p className="text-xs font-bold text-primary mt-1">{movie1Votes} votes</p>
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
              <p className="text-xs font-bold text-primary mt-1">{movie2Votes} votes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
