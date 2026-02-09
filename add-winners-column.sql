-- Add winners column to track which movie won each matchup
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS winners INTEGER[];

-- Also add a column to track current round for bracket-style tournaments
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 1;

-- Verify the changes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'lobbies'
AND column_name IN ('winners', 'current_round');
