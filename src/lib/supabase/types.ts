export interface Lobby {
  id: string;
  code: string;
  actor1_id: number;
  actor2_id: number;
  actor1_name: string;
  actor2_name: string;
  movie_count: number;
  current_matchup: number;
  is_active: boolean;
  created_at: string;
  // Knockout tournament fields
  current_round?: number;
  round_matchups?: any;  // JSONB array of [movie1_id, movie2_id] pairs
  all_movies?: any;  // JSONB array of movie objects
  champion_movie_id?: number;
  round_start_matchup?: number;  // Global matchup index where current round started
}

export interface Participant {
  id: string;
  lobby_id: string;
  name: string;
  is_host: boolean;
  joined_at: string;
}

export interface Vote {
  id: string;
  lobby_id: string;
  participant_id: string;
  matchup_index: number;
  movie_id: number;
  voted_at: string;
}

export interface LobbyState {
  lobby: Lobby;
  participants: Participant[];
  votes: Vote[];
}
