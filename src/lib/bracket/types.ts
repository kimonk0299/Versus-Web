import { Movie } from '../tmdb/types';

// Re-export Movie type for convenience
export type { Movie };

/**
 * A single matchup in the bracket (two movies competing).
 */
export interface Matchup {
  movie1: Movie;
  movie2: Movie;
  winner: Movie | null;
}

/**
 * The complete bracket state for a tournament.
 */
export interface BracketState {
  /** All rounds in the tournament */
  rounds: Matchup[][];
  /** Current round index (0-based) */
  currentRound: number;
  /** Current matchup index within the current round (0-based) */
  currentMatchup: number;
  /** True if tournament is complete */
  isComplete: boolean;
  /** The winning movie (only set when isComplete is true) */
  champion: Movie | null;
}

/**
 * Bracket state for versus mode (two actors head-to-head).
 */
export interface VersusBracketState {
  /** Actor 1 TMDb ID */
  actor1Id: number;
  /** Actor 2 TMDb ID */
  actor2Id: number;
  /** Actor 1 name */
  actor1Name: string;
  /** Actor 2 name */
  actor2Name: string;
  /** All matchups (Actor1 movie vs Actor2 movie) */
  matchups: Matchup[];
  /** Current matchup index (0-based) */
  currentMatchup: number;
  /** Number of wins for Actor 1 */
  actor1Wins: number;
  /** Number of wins for Actor 2 */
  actor2Wins: number;
  /** True if all matchups are complete */
  isComplete: boolean;
  /** Winning actor's name (only set when isComplete is true) */
  winnerName: string | null;
}
