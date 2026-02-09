import { create } from 'zustand';
import { Movie } from '@/lib/tmdb/types';
import { BracketState, VersusBracketState, Matchup } from '@/lib/bracket/types';
import { getTopMovies } from '@/lib/tmdb/repository';
import { getPersonDetails } from '@/lib/tmdb/client';
import { padToPowerOfTwo, createMatchups, createVersusMatchups } from '@/lib/bracket/algorithm';

interface BracketStoreState {
  // Tournament state
  bracketState: BracketState | null;
  versusBracketState: VersusBracketState | null;
  isVersusMode: boolean;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSingleActor: (actorId: number, movieCount?: number) => Promise<void>;
  loadVersusActors: (actor1Id: number, actor2Id: number, movieCount?: number) => Promise<void>;
  pickWinner: (winner: Movie) => void;
  reset: () => void;
}

export const useBracketStore = create<BracketStoreState>((set, get) => ({
  bracketState: null,
  versusBracketState: null,
  isVersusMode: false,
  isLoading: false,
  error: null,

  /**
   * Load a single actor's movies and initialize the bracket.
   */
  loadSingleActor: async (actorId: number, movieCount: number = 16) => {
    set({ isLoading: true, error: null, isVersusMode: false });

    try {
      // Fetch top movies for this actor
      const movies = await getTopMovies(actorId, movieCount);

      if (movies.length < 2) {
        set({
          error: 'Not enough movies found for this actor (need at least 2).',
          isLoading: false,
        });
        return;
      }

      // Pad to nearest power of 2
      const paddedMovies = padToPowerOfTwo(movies);

      // Create first round matchups
      const matchups = createMatchups(paddedMovies);

      // Initialize bracket state
      set({
        bracketState: {
          rounds: [matchups],
          currentRound: 0,
          currentMatchup: 0,
          isComplete: false,
          champion: null,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load movies',
        isLoading: false,
      });
    }
  },

  /**
   * Load two actors' movies and initialize versus mode.
   */
  loadVersusActors: async (actor1Id: number, actor2Id: number, movieCount: number = 16) => {
    set({ isLoading: true, error: null, isVersusMode: true });

    try {
      // Fetch actor names
      const [actor1Details, actor2Details] = await Promise.all([
        getPersonDetails(actor1Id),
        getPersonDetails(actor2Id),
      ]);

      // Fetch top movies from each actor
      const [movies1, movies2] = await Promise.all([
        getTopMovies(actor1Id, movieCount),
        getTopMovies(actor2Id, movieCount),
      ]);

      if (movies1.length < 2 || movies2.length < 2) {
        set({
          error: 'Not enough movies found for one of the actors (need at least 2 each).',
          isLoading: false,
        });
        return;
      }

      // CRITICAL: Shuffle each actor's movies independently, then pair by index
      const matchups = createVersusMatchups(movies1, movies2);

      // Initialize versus bracket state
      set({
        versusBracketState: {
          actor1Id,
          actor2Id,
          actor1Name: actor1Details.name,
          actor2Name: actor2Details.name,
          matchups,
          currentMatchup: 0,
          actor1Wins: 0,
          actor2Wins: 0,
          isComplete: false,
          winnerName: null,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load versus matchups',
        isLoading: false,
      });
    }
  },

  /**
   * User picked a movie as the winner of the current matchup.
   */
  pickWinner: (winner: Movie) => {
    const state = get();

    if (state.isVersusMode) {
      // Versus mode logic
      const vsState = state.versusBracketState;
      if (!vsState) return;

      const currentMatchup = vsState.matchups[vsState.currentMatchup];
      if (!currentMatchup) return;

      // Determine which actor won
      let actor1Wins = vsState.actor1Wins;
      let actor2Wins = vsState.actor2Wins;

      if (winner.id === currentMatchup.movie1.id) {
        actor1Wins++;
      } else {
        actor2Wins++;
      }

      // Update matchup with winner
      const updatedMatchups = [...vsState.matchups];
      updatedMatchups[vsState.currentMatchup] = {
        ...currentMatchup,
        winner,
      };

      // Check if tournament is complete
      const isComplete = vsState.currentMatchup + 1 >= vsState.matchups.length;
      const winnerName = isComplete
        ? actor1Wins > actor2Wins
          ? vsState.actor1Name
          : vsState.actor2Name
        : null;

      set({
        versusBracketState: {
          ...vsState,
          matchups: updatedMatchups,
          currentMatchup: vsState.currentMatchup + 1,
          actor1Wins,
          actor2Wins,
          isComplete,
          winnerName,
        },
      });
    } else {
      // Single actor bracket logic
      const bState = state.bracketState;
      if (!bState) return;

      const currentRound = bState.rounds[bState.currentRound];
      if (!currentRound) return;

      const currentMatchup = currentRound[bState.currentMatchup];
      if (!currentMatchup) return;

      // Update matchup with winner
      const updatedMatchups = [...currentRound];
      updatedMatchups[bState.currentMatchup] = {
        ...currentMatchup,
        winner,
      };

      const updatedRounds = [...bState.rounds];
      updatedRounds[bState.currentRound] = updatedMatchups;

      // Collect winners from this round
      const roundWinners: Movie[] = updatedMatchups
        .map(m => m.winner)
        .filter((w): w is Movie => w !== null);

      if (bState.currentMatchup + 1 < currentRound.length) {
        // More matchups in this round → advance to next matchup
        set({
          bracketState: {
            ...bState,
            rounds: updatedRounds,
            currentMatchup: bState.currentMatchup + 1,
          },
        });
      } else {
        // Round complete → check if tournament is over
        if (roundWinners.length === 1) {
          // Only one winner left → CHAMPION!
          set({
            bracketState: {
              ...bState,
              rounds: updatedRounds,
              isComplete: true,
              champion: winner,
            },
          });
        } else {
          // Create next round with the winners
          const nextRoundMatchups = createMatchups(roundWinners);
          const newRounds = [...updatedRounds, nextRoundMatchups];

          set({
            bracketState: {
              ...bState,
              rounds: newRounds,
              currentRound: bState.currentRound + 1,
              currentMatchup: 0,
            },
          });
        }
      }
    }
  },

  reset: () => {
    set({
      bracketState: null,
      versusBracketState: null,
      isVersusMode: false,
      isLoading: false,
      error: null,
    });
  },
}));
