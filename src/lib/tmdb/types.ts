// TMDb API Response Types

export interface TmdbPerson {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  known_for?: TmdbMovie[];
}

export interface PersonSearchResponse {
  page: number;
  results: TmdbPerson[];
  total_pages: number;
  total_results: number;
}

export interface TmdbMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  overview: string;
  popularity: number;
}

export interface CastCredit {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  character: string;
  order: number;
  overview: string;
}

export interface MovieCreditsResponse {
  cast: CastCredit[];
  crew: any[];
  id: number;
}

export interface PersonDetailsResponse {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  biography: string;
  birthday: string | null;
  place_of_birth: string | null;
  popularity: number;
}

// Internal Movie type (with computed popularity score)
export interface Movie {
  id: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  releaseYear: number;
  voteAverage: number;
  voteCount: number;
  overview: string;
  popularity: number; // CRITICAL: voteCount × voteAverage
  character?: string;
}

// Actor from preset database
export interface PresetActor {
  id: number;
  name: string;
  aliases: string[];
}

export interface PresetActorDatabase {
  tamil_actors?: PresetActor[];
  tamil_actresses?: PresetActor[];
  telugu_actors?: PresetActor[];
  telugu_actresses?: PresetActor[];
  bollywood_actors?: PresetActor[];
  bollywood_actresses?: PresetActor[];
  hollywood_actors?: PresetActor[];
  hollywood_actresses?: PresetActor[];
}
