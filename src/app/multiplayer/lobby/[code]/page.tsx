'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Lobby, Participant } from '@/lib/supabase/types';

export default function LobbyWaitingRoom({
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    loadLobbyData();
    subscribeToChanges();
  }, [code]);

  const loadLobbyData = async () => {
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
        .eq('lobby_id', lobbyData.id)
        .order('joined_at', { ascending: true });

      if (participantsError) throw participantsError;
      setParticipants(participantsData);

      // Check if current user is host
      const currentParticipant = participantsData.find(p => p.id === participantId);
      setIsHost(currentParticipant?.is_host || false);

      setIsLoading(false);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const subscribeToChanges = () => {
    // Subscribe to participant changes
    const participantsChannel = supabase
      .channel(`lobby-${code}-participants`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
        },
        () => {
          loadLobbyData();
        }
      )
      .subscribe();

    // Subscribe to lobby changes (for game start)
    const lobbyChannel = supabase
      .channel(`lobby-${code}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lobbies',
        },
        (payload) => {
          const updatedLobby = payload.new as Lobby;
          if (updatedLobby.current_matchup > 0) {
            // Game started!
            router.push(`/multiplayer/game/${code}?participant=${participantId}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(lobbyChannel);
    };
  };

  const handleStartGame = async () => {
    if (!lobby) return;

    try {
      await supabase
        .from('lobbies')
        .update({ current_matchup: 1 })
        .eq('id', lobby.id);

      // Navigation will happen via subscription
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (error || !lobby) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl text-center">
          <h2 className="text-2xl font-fredoka font-bold text-secondary mb-4">
            Error
          </h2>
          <p className="text-foreground/70 mb-6">{error || 'Lobby not found'}</p>
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex flex-col max-w-md mx-auto">
        {/* Top spacing */}
        <div className="h-6" />

        {/* Lobby Code */}
        <div className="text-center mb-8">
          <p className="text-sm font-nunito text-foreground/60 mb-2">Lobby Code</p>
          <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-2xl py-4 px-6 inline-block">
            <p className="text-5xl font-fredoka font-black tracking-wider">{lobby.code}</p>
          </div>
        </div>

        {/* Matchup Info */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          <p className="text-xs font-nunito text-foreground/60 mb-3 text-center">MATCHUP</p>
          <p className="text-2xl font-fredoka font-bold text-center">
            {lobby.actor1_name} <span className="text-primary">VS</span> {lobby.actor2_name}
          </p>
          <p className="text-sm font-nunito text-foreground/60 mt-2 text-center">
            {lobby.movie_count} movies each
          </p>
        </div>

        {/* Participants */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          <h3 className="text-lg font-fredoka font-bold text-foreground mb-4">
            Players ({participants.length})
          </h3>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 bg-surface-variant rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-fredoka font-bold text-sm">
                      {participant.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-nunito font-medium text-foreground">
                    {participant.name}
                  </span>
                </div>
                {participant.is_host && (
                  <span className="text-xs font-nunito font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                    HOST
                  </span>
                )}
                {participant.id === participantId && (
                  <span className="text-xs font-nunito font-bold text-secondary bg-secondary/10 px-2 py-1 rounded-full">
                    YOU
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Start Button (Host only) */}
        {isHost && (
          <button
            onClick={handleStartGame}
            disabled={participants.length < 2}
            style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '1.25rem', paddingBottom: '1.25rem' }}
            className={`w-full rounded-2xl font-fredoka font-bold text-base transition-all ${
              participants.length < 2
                ? 'bg-foreground/10 text-foreground/30 cursor-not-allowed'
                : 'bg-primary text-white hover:shadow-lg'
            }`}
          >
            {participants.length < 2 ? 'WAITING FOR PLAYERS...' : 'START GAME'}
          </button>
        )}

        {!isHost && (
          <div className="text-center">
            <p className="text-foreground/60 font-nunito">
              Waiting for host to start the game...
            </p>
          </div>
        )}

        {/* Leave Button */}
        <button
          onClick={() => router.push('/')}
          style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
          className="mt-4 w-full bg-white text-foreground/70 border-2 border-foreground/20 rounded-xl font-nunito font-medium transition-all hover:border-foreground/40"
        >
          Leave Lobby
        </button>
      </div>
    </div>
  );
}
