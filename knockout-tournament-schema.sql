-- =====================================================
-- KNOCKOUT TOURNAMENT SCHEMA
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add columns for knockout tournament tracking
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 1;
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS round_matchups JSONB DEFAULT '[]'::jsonb;
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS all_movies JSONB DEFAULT '[]'::jsonb;
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS champion_movie_id INTEGER;

-- round_matchups structure: [[movie1_id, movie2_id], [movie3_id, movie4_id], ...]
-- all_movies: stores all movies at game start for reference
-- champion_movie_id: the winning movie ID

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'lobbies'
AND column_name IN ('current_round', 'round_matchups', 'all_movies', 'champion_movie_id');
