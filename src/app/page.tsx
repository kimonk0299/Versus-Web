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
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-surface-variant via-background to-background">
      <div className="max-w-2xl w-full">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-fredoka font-bold text-primary mb-4">
            VERSUS
          </h1>
          <p className="text-xl text-foreground/70 font-nunito">
            Who reigns supreme? Pick your champion!
          </p>
        </div>

        {/* Mode Selection */}
        <div className="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <h2 className="text-2xl font-fredoka font-semibold text-foreground mb-4">
            Choose Mode
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setMode('single')}
              className={`py-4 px-6 rounded-xl font-nunito font-bold text-lg transition-all ${
                mode === 'single'
                  ? 'bg-primary text-white shadow-lg scale-105'
                  : 'bg-surface-variant text-foreground/70 hover:bg-surface-variant/80'
              }`}
            >
              Single Actor
            </button>
            <button
              onClick={() => setMode('versus')}
              className={`py-4 px-6 rounded-xl font-nunito font-bold text-lg transition-all ${
                mode === 'versus'
                  ? 'bg-secondary text-white shadow-lg scale-105'
                  : 'bg-surface-variant text-foreground/70 hover:bg-surface-variant/80'
              }`}
            >
              Actor vs Actor
            </button>
          </div>

          {/* Actor 1 Search */}
          <div className="relative mb-6">
            <ActorSearchField
              value={actor1Query}
              onChange={setActor1Query}
              label={mode === 'single' ? 'Actor Name' : 'Actor 1'}
              placeholder="Type actor name..."
            />
            <SuggestionsList
              suggestions={actor1Suggestions}
              onSelect={selectActor1}
            />
          </div>

          {/* Actor 2 Search (Versus mode only) */}
          {mode === 'versus' && (
            <div className="relative mb-6">
              <ActorSearchField
                value={actor2Query}
                onChange={setActor2Query}
                label="Actor 2"
                placeholder="Type actor name..."
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
            className={`w-full py-4 rounded-xl font-fredoka font-bold text-xl transition-all ${
              canStartTournament()
                ? 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:scale-105'
                : 'bg-foreground/20 text-foreground/40 cursor-not-allowed'
            }`}
          >
            START TOURNAMENT
          </button>
        </div>

        {/* Instructions */}
        <div className="text-center text-foreground/60 text-sm">
          <p>Start typing to see suggestions from our preset actor database.</p>
          <p className="mt-2">
            Don&apos;t see your actor? We&apos;ll search TMDb for you!
          </p>
        </div>
      </div>
    </div>
  );
}
