import { getPersonMovieCredits } from './client';
import { Movie } from './types';
import { MAX_CAST_ORDER } from '../constants';

/**
 * Get top movies for an actor, sorted by popularity score.
 *
 * CRITICAL BUSINESS LOGIC (from Android MovieRepository.kt):
 * 1. Filter out cameos/minor roles (order >= 10)
 * 2. Calculate popularity as voteCount × voteAverage (NOT TMDb's popularity field)
 * 3. Sort by this computed popularity (highest first)
 *
 * @param actorId TMDb person ID
 * @param count How many movies to return (default: 16 for single actor mode)
 * @returns Sorted list of top movies where actor had a significant role
 */
export async function getTopMovies(actorId: number, count: number = 16): Promise<Movie[]> {
  const response = await getPersonMovieCredits(actorId);

  const movies = response.cast
    // Filter out entries with no title (poster is optional)
    .filter(item => item.title != null)
    // CRITICAL: Filter out cameos and minor roles (order >= 10)
    // order 0-9 typically indicates lead or main supporting roles
    .filter(item => item.order < MAX_CAST_ORDER)
    // Calculate popularity score: voteCount × voteAverage
    // This gives better results than TMDb's built-in popularity
    // because it considers both how MANY people rated it AND how HIGH they rated it
    .map(castItem => {
      const releaseYear = castItem.release_date
        ? parseInt(castItem.release_date.substring(0, 4), 10)
        : 0;

      return {
        id: castItem.id,
        title: castItem.title,
        posterPath: castItem.poster_path,
        backdropPath: castItem.backdrop_path,
        releaseDate: castItem.release_date,
        releaseYear,
        voteAverage: castItem.vote_average,
        voteCount: castItem.vote_count,
        overview: castItem.overview,
        // CRITICAL: Use voteCount × voteAverage, NOT TMDb's popularity field
        popularity: castItem.vote_count * castItem.vote_average,
        character: castItem.character,
      } as Movie;
    });

  // CRITICAL: Deduplicate by movie ID (actor might appear multiple times in same movie)
  const uniqueMovies = movies.reduce((acc, movie) => {
    if (!acc.find(m => m.id === movie.id)) {
      acc.push(movie);
    }
    return acc;
  }, [] as Movie[]);

  return uniqueMovies
    // Sort by popularity (highest first)
    .sortedByDescending(movie => movie.popularity)
    // Take only the top N movies
    .slice(0, count);
}

// Helper function to sort array in descending order
Array.prototype.sortedByDescending = function<T>(this: T[], keyFn: (item: T) => number): T[] {
  return [...this].sort((a, b) => keyFn(b) - keyFn(a));
};

// Type declaration for the extension
declare global {
  interface Array<T> {
    sortedByDescending(keyFn: (item: T) => number): T[];
  }
}
