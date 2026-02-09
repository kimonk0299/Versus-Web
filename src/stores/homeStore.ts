import { create } from 'zustand';
import { PresetActor } from '@/lib/tmdb/types';
import { searchPresetActors, findActorByExactName } from '@/lib/preset-actors/database';

type TournamentMode = 'single' | 'versus';
type MovieCount = 8 | 16 | 32;

interface HomeState {
  // Mode selection
  mode: TournamentMode;
  setMode: (mode: TournamentMode) => void;

  // Movie count selection
  movieCount: MovieCount;
  setMovieCount: (count: MovieCount) => void;

  // Actor 1 search
  actor1Query: string;
  actor1Id: number | null;
  actor1Suggestions: PresetActor[];
  setActor1Query: (query: string) => void;
  selectActor1: (actor: PresetActor) => void;
  clearActor1: () => void;

  // Actor 2 search (for versus mode)
  actor2Query: string;
  actor2Id: number | null;
  actor2Suggestions: PresetActor[];
  setActor2Query: (query: string) => void;
  selectActor2: (actor: PresetActor) => void;
  clearActor2: () => void;

  // Validation
  canStartTournament: () => boolean;
  needsDisambiguation: (actorNum: 1 | 2) => boolean;
}

export const useHomeStore = create<HomeState>((set, get) => ({
  // Initial state
  mode: 'single',
  movieCount: 16,
  actor1Query: '',
  actor1Id: null,
  actor1Suggestions: [],
  actor2Query: '',
  actor2Id: null,
  actor2Suggestions: [],

  setMode: (mode) => set({ mode }),
  setMovieCount: (count) => set({ movieCount: count }),

  setActor1Query: (query) => {
    // Search for suggestions as user types
    const rawSuggestions = query.length >= 2 ? searchPresetActors(query) : [];

    // Deduplicate by ID (preset_actors.json has some duplicate TMDb IDs)
    const uniqueSuggestions = rawSuggestions.reduce((acc, actor) => {
      if (!acc.find(a => a.id === actor.id)) {
        acc.push(actor);
      }
      return acc;
    }, [] as PresetActor[]);

    set({ actor1Query: query, actor1Suggestions: uniqueSuggestions });

    // Check for exact match
    const exactMatch = findActorByExactName(query);
    if (exactMatch) {
      set({ actor1Id: exactMatch.id });
    } else {
      set({ actor1Id: null });
    }
  },

  selectActor1: (actor) => {
    set({
      actor1Query: actor.name,
      actor1Id: actor.id,
      actor1Suggestions: [],
    });
  },

  clearActor1: () => {
    set({
      actor1Query: '',
      actor1Id: null,
      actor1Suggestions: [],
    });
  },

  setActor2Query: (query) => {
    const rawSuggestions = query.length >= 2 ? searchPresetActors(query) : [];

    // Deduplicate by ID (preset_actors.json has some duplicate TMDb IDs)
    const uniqueSuggestions = rawSuggestions.reduce((acc, actor) => {
      if (!acc.find(a => a.id === actor.id)) {
        acc.push(actor);
      }
      return acc;
    }, [] as PresetActor[]);

    set({ actor2Query: query, actor2Suggestions: uniqueSuggestions });

    const exactMatch = findActorByExactName(query);
    if (exactMatch) {
      set({ actor2Id: exactMatch.id });
    } else {
      set({ actor2Id: null });
    }
  },

  selectActor2: (actor) => {
    set({
      actor2Query: actor.name,
      actor2Id: actor.id,
      actor2Suggestions: [],
    });
  },

  clearActor2: () => {
    set({
      actor2Query: '',
      actor2Id: null,
      actor2Suggestions: [],
    });
  },

  canStartTournament: () => {
    const state = get();
    if (state.mode === 'single') {
      // Single mode: need actor1 query (may need disambiguation)
      return state.actor1Query.trim().length > 0;
    } else {
      // Versus mode: need both actor queries
      return (
        state.actor1Query.trim().length > 0 &&
        state.actor2Query.trim().length > 0
      );
    }
  },

  needsDisambiguation: (actorNum) => {
    const state = get();
    const query = actorNum === 1 ? state.actor1Query : state.actor2Query;
    const actorId = actorNum === 1 ? state.actor1Id : state.actor2Id;

    // Needs disambiguation if there's a query but no exact match
    return query.trim().length > 0 && actorId === null;
  },
}));
