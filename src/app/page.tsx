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
      // Check if we need disambiguation
      if (needsDisambiguation(1)) {
        // Navigate to disambiguation screen
        router.push(`/disambiguation/${encodeURIComponent(actor1Query)}`);
      } else if (actor1Id) {
        // Direct to bracket
        router.push(`/bracket/${actor1Id}`);
      }
    } else {
      // Versus mode
      const needsDisamb1 = needsDisambiguation(1);
      const needsDisamb2 = needsDisambiguation(2);

      if (needsDisamb1) {
        router.push(`/disambiguation/${encodeURIComponent(actor1Query)}?mode=versus&next=actor2`);
      } else if (needsDisamb2) {
        router.push(`/disambiguation/${encodeURIComponent(actor2Query)}?mode=versus&actor1=${actor1Id}`);
      } else if (actor1Id && actor2Id) {
        router.push(`/bracket/${actor1Id}/vs/${actor2Id}`);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col justify-center p-6 bg-background overflow-hidden">
      <div className="w-full max-w-md mx-auto">
        {/* Film Icon */}
        <div className="text-center mb-4">
          <div className="inline-block text-6xl">🎬</div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-fredoka font-bold text-primary mb-2">
            VERSUS
          </h1>
          <p className="text-base text-foreground/60 font-nunito">
            Movie Tournament
          </p>
        </div>

        {/* Mode Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-fredoka font-semibold text-foreground mb-4 text-center">
            Choose Mode
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setMode('single')}
              className={`py-4 px-4 rounded-2xl font-nunito font-semibold text-base transition-all border-2 flex items-center justify-center gap-2 ${
                mode === 'single'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-foreground/70 border-foreground/20'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Single Actor
            </button>
            <button
              onClick={() => setMode('versus')}
              className={`py-4 px-4 rounded-2xl font-nunito font-semibold text-base transition-all border-2 flex items-center justify-center gap-2 ${
                mode === 'versus'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-foreground/70 border-foreground/20'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Actor vs Actor
            </button>
          </div>

          {/* Actor 1 Search */}
          <div className="relative mb-6">
            <ActorSearchField
              value={actor1Query}
              onChange={setActor1Query}
              label=""
              placeholder={mode === 'single' ? 'Actor Name' : 'Actor 1'}
            />
            <SuggestionsList
              suggestions={actor1Suggestions}
              onSelect={selectActor1}
            />
          </div>

          {/* VS Text (Versus mode only) */}
          {mode === 'versus' && (
            <div className="text-center my-4">
              <span className="text-3xl font-fredoka font-bold text-primary">VS</span>
            </div>
          )}

          {/* Actor 2 Search (Versus mode only) */}
          {mode === 'versus' && (
            <div className="relative mb-6">
              <ActorSearchField
                value={actor2Query}
                onChange={setActor2Query}
                label=""
                placeholder="Actor 2"
              />
              <SuggestionsList
                suggestions={actor2Suggestions}
                onSelect={selectActor2}
              />
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={handleStartTournament}
            disabled={!canStartTournament()}
            className={`w-full py-4 rounded-2xl font-fredoka font-bold text-lg transition-all ${
              canStartTournament()
                ? 'bg-foreground/10 text-foreground/50 hover:bg-foreground/15'
                : 'bg-foreground/5 text-foreground/30 cursor-not-allowed'
            }`}
          >
            START TOURNAMENT
          </button>
        </div>

        {/* Instructions */}
        <div className="text-center text-foreground/50 text-sm px-4">
          <p>
            {mode === 'single'
              ? 'Pick an actor and their top 16 movies battle it out in a tournament bracket!'
              : 'Pick two actors and their top movies go head to head — the actor with more wins takes it!'}
          </p>
        </div>
      </div>
    </div>
  );
}
