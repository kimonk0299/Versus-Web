import { PersonSearchResponse, MovieCreditsResponse, PersonDetailsResponse } from './types';

// Client-side fetch wrappers for TMDb API routes

export async function searchPerson(query: string): Promise<PersonSearchResponse> {
  const response = await fetch(`/api/tmdb/search/person?query=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to search person');
  }
  return response.json();
}

export async function getPersonDetails(personId: number): Promise<PersonDetailsResponse> {
  const response = await fetch(`/api/tmdb/person/${personId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch person details');
  }
  return response.json();
}

export async function getPersonMovieCredits(personId: number): Promise<MovieCreditsResponse> {
  const response = await fetch(`/api/tmdb/person/${personId}/movie_credits`);
  if (!response.ok) {
    throw new Error('Failed to fetch movie credits');
  }
  return response.json();
}
