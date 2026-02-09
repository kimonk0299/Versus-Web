-- Add round_start_matchup to track where the current round starts in the global matchup sequence
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS round_start_matchup INTEGER DEFAULT 1;

-- For existing lobbies in Round 1, set round_start_matchup to 1
UPDATE lobbies SET round_start_matchup = 1 WHERE round_start_matchup IS NULL;

-- Verify
SELECT id, code, current_round, current_matchup, round_start_matchup
FROM lobbies
WHERE is_active = true;
