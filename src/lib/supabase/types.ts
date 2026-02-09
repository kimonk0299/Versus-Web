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
