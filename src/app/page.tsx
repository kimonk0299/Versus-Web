'use client';

import { useRouter } from 'next/navigation';
import { useHomeStore } from '@/stores/homeStore';
import ActorSearchField from '@/components/ActorSearchField';
import SuggestionsList from '@/components/SuggestionsList';

export default function Home() {
  const router = useRouter();
  const {
    mode,
    setMode,
    movieCount,
    setMovieCount,
    actor1Query,
    actor1Id,
    actor1Suggestions,
    setActor1Query,
    selectActor1,
    actor2Query,
    actor2Id,
    actor2Suggestions,
    setActor2Query,
    selectActor2,
    canStartTournament,
    needsDisambiguation,
  } = useHomeStore();

  const handleStartTournament = () => {
    if (mode === 'single') {
      if (needsDisambiguation(1)) {
        router.push(`/disambiguation/${encodeURIComponent(actor1Query)}?count=${movieCount}`);
      } else if (actor1Id) {
        router.push(`/bracket/${actor1Id}?count=${movieCount}`);
      }
    } else {
      const needsDisamb1 = needsDisambiguation(1);
      const needsDisamb2 = needsDisambiguation(2);

      if (needsDisamb1) {
        router.push(`/disambiguation/${encodeURIComponent(actor1Query)}?mode=versus&next=actor2&count=${movieCount}`);
      } else if (needsDisamb2) {
        router.push(`/disambiguation/${encodeURIComponent(actor2Query)}?mode=versus&actor1=${actor1Id}&count=${movieCount}`);
      } else if (actor1Id && actor2Id) {
        router.push(`/bracket/${actor1Id}/vs/${actor2Id}?count=${movieCount}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex flex-col">
        {/* Top spacing - 48dp */}
        <div className="h-12" />

        {/* App Title */}
        <div className="flex flex-col items-center">
          <div className="text-5xl mb-2">🎬</div>
          <h1 className="text-6xl font-fredoka font-black text-primary mb-2">
            VERSUS
          </h1>
          <p className="text-base text-foreground/70 font-nunito">
            Movie Tournament
          </p>
        </div>

        {/* 32dp spacing */}
        <div className="h-8" />

        {/* Mode Selector */}
        <h2 className="text-xl font-nunito font-medium text-foreground text-center">
          Choose Mode
        </h2>

        {/* 8dp spacing */}
        <div className="h-2" />

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setMode('single')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full border-2 font-nunito font-semibold text-sm transition-all ${
              mode === 'single'
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-foreground/70 border-foreground/20'
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Single Actor
          </button>
          <button
            onClick={() => setMode('versus')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full border-2 font-nunito font-semibold text-sm transition-all ${
              mode === 'versus'
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-foreground/70 border-foreground/20'
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            Actor vs Actor
          </button>
        </div>

        {/* 16dp spacing */}
        <div className="h-4" />

        {/* Movie Count Selector */}
        <h2 className="text-xl font-nunito font-medium text-foreground text-center">
          Number of Movies
        </h2>

        {/* 8dp spacing */}
        <div className="h-2" />

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setMovieCount(8)}
            className={`px-6 py-3 rounded-full border-2 font-nunito font-semibold text-sm transition-all ${
              movieCount === 8
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-foreground/70 border-foreground/20'
            }`}
          >
            8
          </button>
          <button
            onClick={() => setMovieCount(16)}
            className={`px-6 py-3 rounded-full border-2 font-nunito font-semibold text-sm transition-all ${
              movieCount === 16
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-foreground/70 border-foreground/20'
            }`}
          >
            16
          </button>
          <button
            onClick={() => setMovieCount(32)}
            className={`px-6 py-3 rounded-full border-2 font-nunito font-semibold text-sm transition-all ${
              movieCount === 32
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-foreground/70 border-foreground/20'
            }`}
          >
            32
          </button>
        </div>

        {/* 24dp spacing */}
        <div className="h-6" />

        {/* Actor 1 Input */}
        <div className="relative">
          <ActorSearchField
            value={actor1Query}
            onChange={setActor1Query}
            placeholder={mode === 'single' ? 'Actor Name' : 'Actor 1'}
          />
          {actor1Suggestions.length > 0 && !actor1Id && (
            <SuggestionsList
              suggestions={actor1Suggestions}
              onSelect={selectActor1}
            />
          )}
        </div>

        {/* Versus mode: VS text and Actor 2 */}
        {mode === 'versus' && (
          <>
            {/* 12dp spacing */}
            <div className="h-3" />

            <div className="text-center py-1">
              <span className="text-3xl font-fredoka font-black text-primary">VS</span>
            </div>

            {/* 4dp spacing */}
            <div className="h-1" />

            <div className="relative">
              <ActorSearchField
                value={actor2Query}
                onChange={setActor2Query}
                placeholder="Actor 2"
              />
              {actor2Suggestions.length > 0 && !actor2Id && (
                <SuggestionsList
                  suggestions={actor2Suggestions}
                  onSelect={selectActor2}
                />
              )}
            </div>
          </>
        )}

        {/* 32dp spacing */}
        <div className="h-8" />

        {/* Start Button - 56dp height */}
        <button
          onClick={handleStartTournament}
          disabled={!canStartTournament()}
          className={`w-full h-14 rounded-2xl font-fredoka font-bold text-base transition-all ${
            canStartTournament()
              ? 'bg-primary text-white'
              : 'bg-foreground/10 text-foreground/30 cursor-not-allowed'
          }`}
        >
          START TOURNAMENT
        </button>

        {/* 16dp spacing */}
        <div className="h-4" />

        {/* Hint text */}
        <p className="text-sm text-foreground/50 text-center font-nunito leading-relaxed">
          {mode === 'single'
            ? `Pick an actor and their top ${movieCount} movies\nbattle it out in a tournament bracket!`
            : `Pick two actors and their top ${movieCount} movies each\ngo head to head — the actor with more wins takes it!`}
        </p>
      </div>
    </div>
  );
}
