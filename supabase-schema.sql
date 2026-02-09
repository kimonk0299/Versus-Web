-- Versus Multiplayer Database Schema
-- Run this in your Supabase SQL Editor

-- Lobbies table
CREATE TABLE lobbies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(3) UNIQUE NOT NULL,
  actor1_id INTEGER NOT NULL,
  actor2_id INTEGER NOT NULL,
  actor1_name VARCHAR(255) NOT NULL,
  actor2_name VARCHAR(255) NOT NULL,
  movie_count INTEGER NOT NULL CHECK (movie_count IN (8, 16, 32)),
  current_matchup INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participants table
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID REFERENCES lobbies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  is_host BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID REFERENCES lobbies(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  matchup_index INTEGER NOT NULL,
  movie_id INTEGER NOT NULL,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lobby_id, participant_id, matchup_index)
);

-- Indexes for better query performance
CREATE INDEX idx_lobbies_code ON lobbies(code);
CREATE INDEX idx_lobbies_is_active ON lobbies(is_active);
CREATE INDEX idx_participants_lobby ON participants(lobby_id);
CREATE INDEX idx_votes_lobby ON votes(lobby_id);
CREATE INDEX idx_votes_matchup ON votes(matchup_index);

-- Enable Row Level Security (RLS)
ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now - you can restrict later)
CREATE POLICY "Enable read access for all users" ON lobbies FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lobbies FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lobbies FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON participants FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON participants FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON votes FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON votes FOR INSERT WITH CHECK (true);

-- Function to generate random 3-letter code
CREATE OR REPLACE FUNCTION generate_lobby_code()
RETURNS VARCHAR(3) AS $$
DECLARE
  chars VARCHAR := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude confusing chars
  result VARCHAR := '';
  i INTEGER;
BEGIN
  FOR i IN 1..3 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
