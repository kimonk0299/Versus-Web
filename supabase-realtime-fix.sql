-- =====================================================
-- SUPABASE REAL-TIME FIX
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Step 1: Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE lobbies;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;

-- Step 2: Create RLS policies if they don't exist

-- Allow everyone to read lobbies
CREATE POLICY IF NOT EXISTS "Enable read access for all users"
ON "public"."lobbies"
FOR SELECT
USING (true);

-- Allow everyone to update lobbies (for game start)
CREATE POLICY IF NOT EXISTS "Enable update access for all users"
ON "public"."lobbies"
FOR UPDATE
USING (true);

-- Allow everyone to read participants
CREATE POLICY IF NOT EXISTS "Enable read access for all users"
ON "public"."participants"
FOR SELECT
USING (true);

-- Allow everyone to insert/delete participants
CREATE POLICY IF NOT EXISTS "Enable insert access for all users"
ON "public"."participants"
FOR INSERT
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable delete access for all users"
ON "public"."participants"
FOR DELETE
USING (true);

-- Allow everyone to update participants (for host transfer)
CREATE POLICY IF NOT EXISTS "Enable update access for all users"
ON "public"."participants"
FOR UPDATE
USING (true);

-- Allow everyone to read votes
CREATE POLICY IF NOT EXISTS "Enable read access for all users"
ON "public"."votes"
FOR SELECT
USING (true);

-- Allow everyone to insert votes
CREATE POLICY IF NOT EXISTS "Enable insert access for all users"
ON "public"."votes"
FOR INSERT
WITH CHECK (true);

-- Step 3: Verify real-time is enabled
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- You should see: lobbies, participants, votes in the results
