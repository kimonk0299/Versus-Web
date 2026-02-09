import { Movie } from '../tmdb/types';
import { Matchup } from './types';

/**
 * Pad the movie list to the nearest power of 2 (4, 8, 16).
 * The bracket works best with any power of 2.
 *
 * CRITICAL: This matches Android's padding logic (from BracketViewModel.kt:264)
 *
 * @param movies List of movies to pad
 * @returns Padded list (or truncated to nearest power of 2)
 */
export function padToPowerOfTwo(movies: Movie[]): Movie[] {
  // Find the appropriate bracket size based on how many movies we have
  const targetSize =
    movies.length >= 16 ? 16 :
    movies.length >= 8 ? 8 :
    movies.length >= 4 ? 4 :
    2;

  return movies.slice(0, targetSize);
}

/**
 * Create matchups by pairing adjacent movies.
 * Movie 0 vs Movie 1, Movie 2 vs Movie 3, etc.
 *
 * From BracketViewModel.kt:250
 *
 * @param movies List of movies to pair
 * @returns List of matchups
 */
export function createMatchups(movies: Movie[]): Matchup[] {
  const matchups: Matchup[] = [];
  for (let i = 0; i < movies.length; i += 2) {
    if (i + 1 < movies.length) {
      matchups.push({
        movie1: movies[i],
        movie2: movies[i + 1],
        winner: null,
      });
    }
  }
  return matchups;
}

/**
 * Get the round name based on the number of matchups.
 *
 * @param matchupCount Number of matchups in the current round
 * @returns Round name (e.g., "Finals", "Semifinals", "Quarterfinals")
 */
export function getRoundName(matchupCount: number): string {
  switch (matchupCount) {
    case 1:
      return 'Finals';
    case 2:
      return 'Semifinals';
    case 4:
      return 'Quarterfinals';
    case 8:
      return 'Round of 16';
    default:
      return `Round of ${matchupCount * 2}`;
  }
}

/**
 * Shuffle an array (Fisher-Yates shuffle).
 * Used for versus mode to randomly pair movies from two actors.
 *
 * @param array Array to shuffle
 * @returns New shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Create versus matchups by shuffling each actor's movies independently,
 * then pairing by index.
 *
 * CRITICAL: This matches Android's versus pairing logic (from BracketViewModel.kt:123)
 * - Shuffle EACH actor's movies independently
 * - Then pair by index: shuffled1[0] vs shuffled2[0], shuffled1[1] vs shuffled2[1], etc.
 *
 * @param movies1 Actor 1's movies
 * @param movies2 Actor 2's movies
 * @returns List of matchups
 */
export function createVersusMatchups(movies1: Movie[], movies2: Movie[]): Matchup[] {
  // CRITICAL: Shuffle EACH actor's movies independently
  const shuffled1 = shuffleArray(movies1);
  const shuffled2 = shuffleArray(movies2);

  // Pair by index
  const pairCount = Math.min(shuffled1.length, shuffled2.length);
  const matchups: Matchup[] = [];

  for (let i = 0; i < pairCount; i++) {
    matchups.push({
      movie1: shuffled1[i],
      movie2: shuffled2[i],
      winner: null,
    });
  }

  return matchups;
}
