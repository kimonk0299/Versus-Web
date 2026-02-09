'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinLobbyPage() {
  const router = useRouter();
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      <div className="flex flex-col max-w-md mx-auto">
        {/* Top spacing - 24dp */}
        <div className="h-6" />

        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-foreground/70 mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Title */}
        <h1 className="text-5xl font-fredoka font-black text-primary mb-2 text-center">
          JOIN LOBBY
        </h1>
        <p className="text-base text-foreground/70 font-nunito text-center mb-8">
          Enter the 3-letter code
        </p>

        {error && (
          <div className="bg-secondary/10 border-2 border-secondary rounded-xl p-4 mb-6">
            <p className="text-secondary font-nunito text-center">{error}</p>
          </div>
        )}

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
      </div>
    </div>
  );
}
