import { create } from 'zustand';
import { TmdbPerson } from '@/lib/tmdb/types';
import { searchPerson } from '@/lib/tmdb/client';

interface DisambiguationState {
  query: string;
  results: TmdbPerson[];
  isLoading: boolean;
  error: string | null;

  searchActors: (query: string) => Promise<void>;
  clearResults: () => void;
}

export const useDisambiguationStore = create<DisambiguationState>((set) => ({
  query: '',
  results: [],
  isLoading: false,
  error: null,

  searchActors: async (query: string) => {
    set({ query, isLoading: true, error: null });

    try {
      const response = await searchPerson(query);
      set({ results: response.results, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to search actors',
        isLoading: false,
      });
    }
  },

  clearResults: () => {
    set({ query: '', results: [], error: null });
  },
}));
