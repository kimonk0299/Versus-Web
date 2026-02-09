// TMDb API Configuration
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Image sizes (from TMDb API documentation)
export const IMAGE_SIZES = {
  poster: {
    small: 'w185',
    medium: 'w342',
    large: 'w500',
    original: 'original',
  },
  profile: {
    small: 'w185',
    medium: 'w342',
    large: 'h632',
    original: 'original',
  },
  backdrop: {
    small: 'w300',
    medium: 'w780',
    large: 'w1280',
    original: 'original',
  },
} as const;

// Minimum votes required for a movie to be included (from Android app)
export const MIN_VOTE_COUNT = 0;

// Maximum movies to return per actor (from Android app)
export const MAX_MOVIES = 50;

// Role filtering: only include cast members with order < 10 (lead/supporting roles)
export const MAX_CAST_ORDER = 10;
