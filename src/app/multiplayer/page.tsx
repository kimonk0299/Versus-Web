'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHomeStore } from '@/stores/homeStore';

export default function MultiplayerPage() {
  const router = useRouter();
  const { movieCount, setMovieCount, actor1Query, actor1Id, actor2Query, actor2Id } = useHomeStore();
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [hostName, setHostName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateLobby = async () => {
    if (!hostName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!actor1Id || !actor2Id) {
      setError('Please select two actors on the home page first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/lobbies/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor1_id: actor1Id,
          actor2_id: actor2Id,
          actor1_name: actor1Query,
          actor2_name: actor2Query,
          movie_count: movieCount,
          host_name: hostName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create lobby');
      }

      // Navigate to lobby waiting room
      router.push(`/multiplayer/lobby/${data.lobby.code}?participant=${data.participant.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinLobby = async () => {
    if (!joinName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!joinCode.trim() || joinCode.length !== 3) {
      setError('Please enter a 3-letter lobby code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/lobbies/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: joinCode.toUpperCase(),
          name: joinName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join lobby');
      }

      // Navigate to lobby waiting room
      router.push(`/multiplayer/lobby/${data.lobby.code}?participant=${data.participant.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex flex-col">
        {/* Top spacing - 24dp */}
        <div className="h-6" />

        {/* Back button */}
        <button
          onClick={() => mode === 'menu' ? router.push('/') : setMode('menu')}
          className="flex items-center gap-2 text-foreground/70 mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Title */}
        <h1 className="text-5xl font-fredoka font-black text-primary mb-2 text-center">
          MULTIPLAYER
        </h1>
        <p className="text-base text-foreground/70 font-nunito text-center mb-8">
          Play with friends!
        </p>

        {error && (
          <div className="bg-secondary/10 border-2 border-secondary rounded-xl p-4 mb-6">
            <p className="text-secondary font-nunito text-center">{error}</p>
          </div>
        )}

        {mode === 'menu' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '1.5rem', paddingBottom: '1.5rem' }}
              className="w-full bg-primary text-white rounded-2xl font-fredoka font-bold text-lg transition-all hover:shadow-lg"
            >
              CREATE LOBBY
            </button>

            <button
              onClick={() => setMode('join')}
              style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '1.5rem', paddingBottom: '1.5rem' }}
              className="w-full bg-white text-primary border-2 border-primary rounded-2xl font-fredoka font-bold text-lg transition-all hover:shadow-lg"
            >
              JOIN LOBBY
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-nunito font-medium text-foreground/70 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Enter your name"
                style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingTop: '1rem', paddingBottom: '1rem' }}
                className="w-full bg-white border-2 border-foreground/20 rounded-xl focus:border-primary focus:outline-none transition-colors font-nunito text-base text-foreground placeholder:text-foreground/40"
                maxLength={30}
              />
            </div>

            <div className="bg-surface-variant rounded-xl p-4">
              <p className="text-sm font-nunito text-foreground/70 mb-2">Selected Matchup:</p>
              <p className="font-nunito font-bold text-foreground">
                {actor1Query || 'Actor 1'} <span className="text-primary">VS</span> {actor2Query || 'Actor 2'}
              </p>
              <p className="text-xs font-nunito text-foreground/60 mt-1">
                {movieCount} movies each
              </p>
              {(!actor1Id || !actor2Id) && (
                <p className="text-xs font-nunito text-secondary mt-2">
                  ⚠️ Please select actors on the home page first
                </p>
              )}
            </div>

            <button
              onClick={handleCreateLobby}
              disabled={isLoading || !hostName.trim() || !actor1Id || !actor2Id}
              style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '1.25rem', paddingBottom: '1.25rem' }}
              className={`w-full rounded-2xl font-fredoka font-bold text-base transition-all ${
                isLoading || !hostName.trim() || !actor1Id || !actor2Id
                  ? 'bg-foreground/10 text-foreground/30 cursor-not-allowed'
                  : 'bg-primary text-white hover:shadow-lg'
              }`}
            >
              {isLoading ? 'CREATING...' : 'CREATE LOBBY'}
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-nunito font-medium text-foreground/70 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Enter your name"
                style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingTop: '1rem', paddingBottom: '1rem' }}
                className="w-full bg-white border-2 border-foreground/20 rounded-xl focus:border-primary focus:outline-none transition-colors font-nunito text-base text-foreground placeholder:text-foreground/40"
                maxLength={30}
              />
            </div>

            <div>
              <label className="block text-sm font-nunito font-medium text-foreground/70 mb-2">
                Lobby Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC"
                style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingTop: '1rem', paddingBottom: '1rem' }}
                className="w-full bg-white border-2 border-foreground/20 rounded-xl focus:border-primary focus:outline-none transition-colors font-nunito text-2xl text-center font-bold text-foreground placeholder:text-foreground/40 uppercase"
                maxLength={3}
              />
            </div>

            <button
              onClick={handleJoinLobby}
              disabled={isLoading || !joinName.trim() || joinCode.length !== 3}
              style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '1.25rem', paddingBottom: '1.25rem' }}
              className={`w-full rounded-2xl font-fredoka font-bold text-base transition-all ${
                isLoading || !joinName.trim() || joinCode.length !== 3
                  ? 'bg-foreground/10 text-foreground/30 cursor-not-allowed'
                  : 'bg-primary text-white hover:shadow-lg'
              }`}
            >
              {isLoading ? 'JOINING...' : 'JOIN LOBBY'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
