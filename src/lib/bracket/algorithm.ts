import { Movie } from '../tmdb/types';
import { Matchup } from './types';

/**
 * Pad the movie list to the nearest power of 2 (4, 8, 16, 32).
 * The bracket works best with any power of 2.
 *
 * @param movies List of movies to pad
 * @returns Padded list (or truncated to nearest power of 2)
 */
export function padToPowerOfTwo(movies: Movie[]): Movie[] {
  // Find the appropriate bracket size based on how many movies we have
  const targetSize =
    movies.length >= 32 ? 32 :
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
    case 16:
      return 'Round of 32';
    default:
      return `Round of ${matchupCount * 2}`;
  }
}

/**
 * Simple seeded random number generator (using mulberry32 algorithm).
 * Ensures consistent randomness across all clients when given the same seed.
 *
 * @param seed Numeric seed
 * @returns Random number generator function
 */
function seededRandom(seed: number) {
  return function() {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Convert a string (like UUID) to a numeric seed.
 *
 * @param str String to convert
 * @returns Numeric seed
 */
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Shuffle an array (Fisher-Yates shuffle).
 * Used for versus mode to randomly pair movies from two actors.
 *
 * @param array Array to shuffle
 * @param seed Optional seed for consistent shuffling across clients (e.g., lobby ID)
 * @returns New shuffled array
 */
export function shuffleArray<T>(array: T[], seed?: string): T[] {
  const shuffled = [...array];
  const random = seed ? seededRandom(stringToSeed(seed)) : Math.random;

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
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
 * @param seed Optional seed for consistent shuffling (e.g., lobby ID for multiplayer)
 * @returns List of matchups
 */
export function createVersusMatchups(movies1: Movie[], movies2: Movie[], seed?: string): Matchup[] {
  // CRITICAL: Shuffle EACH actor's movies independently
  // Use seed + suffix to ensure different shuffles for each actor
  const shuffled1 = shuffleArray(movies1, seed ? `${seed}-actor1` : undefined);
  const shuffled2 = shuffleArray(movies2, seed ? `${seed}-actor2` : undefined);

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
